import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';
import '../services/database_service.dart';
import '../models/account_model.dart';
import '../models/email_model.dart';
import '../widgets/account_switcher_dialog.dart';
import 'compose_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final _authService = AuthService();
  final _dbService = DatabaseService();

  int _currentTab = 0; // 0: Inbox, 1: Starred, 2: Sent, 3: Unified
  List<EmailModel> _emails = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _startMailboxSync();
    _loadLocalEmails();
  }

  // Sync Firestore for all logged-in accounts
  void _startMailboxSync() {
    final List<AccountModel> accounts = _authService.getCachedAccounts();
    for (var acc in accounts) {
      _dbService.syncMailbox(acc.uid);
    }
  }

  // Load emails from local Hive cache based on the active tab
  void _loadLocalEmails() {
    final active = _authService.currentAccount;
    if (active == null) return;

    setState(() => _isLoading = true);

    List<EmailModel> fetchedList = [];

    if (_currentTab == 3) {
      // Unified Feed
      final List<AccountModel> accounts = _authService.getCachedAccounts();
      final List<String> uids = accounts.map((e) => e.uid).toList();
      fetchedList = _dbService.getUnifiedLocalEmails(uids);
    } else {
      // Single Account Folders
      String? label;
      if (_currentTab == 0) label = 'inbox';
      if (_currentTab == 2) label = 'sent';

      fetchedList = _dbService.getLocalEmails(active.uid, label: label);

      // Manual filter for Starred
      if (_currentTab == 1) {
        fetchedList = fetchedList.where((e) => e.isStarred).toList();
      }
    }

    setState(() {
      _emails = fetchedList;
      _isLoading = false;
    });
  }

  // Refresh feed manually (also triggers live Firestore sync check)
  Future<void> _handleRefresh() async {
    _startMailboxSync();
    _loadLocalEmails();
  }

  // Triggered when user swaps profiles in the switcher dialog
  void _onAccountSwitched() {
    _startMailboxSync();
    _loadLocalEmails();
    setState(() {}); // Re-render scaffold elements (like display names)
  }

  // Displays email details in a premium slide-up bottom sheet
  void _showEmailDetail(EmailModel email) {
    final active = _authService.currentAccount;
    if (active == null) return;

    // Mark as read in background
    _dbService.markAsRead(active.uid, email.id);
    _loadLocalEmails();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF10101D),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final DateTime date = DateTime.fromMillisecondsSinceEpoch(email.timestamp);
            final String dateStr = "${date.day}/${date.month} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";

            return DraggableScrollableSheet(
              initialChildSize: 0.8,
              minChildSize: 0.5,
              maxChildSize: 0.95,
              expand: false,
              builder: (context, scrollController) {
                return SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Bottom Sheet handle
                      Center(
                        child: Container(
                          width: 40,
                          height: 5,
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Actions Row (Delete & Star)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          IconButton(
                            icon: Icon(
                              email.isStarred ? Icons.star_rounded : Icons.star_border_rounded,
                              color: email.isStarred ? const Color(0xFFFF6B35) : Colors.white60,
                            ),
                            onPressed: () async {
                              await _dbService.toggleStar(active.uid, email.id, email.isStarred);
                              setSheetState(() {});
                              _loadLocalEmails();
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent),
                            onPressed: () async {
                              await _dbService.deleteEmail(active.uid, email.id);
                              if (context.mounted) Navigator.pop(context);
                              _loadLocalEmails();
                            },
                          ),
                        ],
                      ),

                      // Subject Title
                      Text(
                        email.subject,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Sender Info Row
                      Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: Colors.white12,
                            child: Text(
                              email.senderName.isNotEmpty ? email.senderName[0].toUpperCase() : 'U',
                              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  email.senderName,
                                  style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                                ),
                                Text(
                                  email.sender,
                                  style: GoogleFonts.plusJakartaSans(fontSize: 12, color: Colors.white54),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            dateStr,
                            style: GoogleFonts.plusJakartaSans(fontSize: 12, color: Colors.white30),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Divider(color: Colors.white10),
                      const SizedBox(height: 20),

                      // Email Body
                      Text(
                        email.body,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          height: 1.5,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  // Renders the Avatar or profile image
  Widget _buildAvatar() {
    final active = _authService.currentAccount;
    return GestureDetector(
      onTap: () {
        showDialog(
          context: context,
          builder: (context) => AccountSwitcherDialog(
            authService: _authService,
            onAccountSwitched: _onAccountSwitched,
          ),
        );
      },
      child: CircleAvatar(
        radius: 18,
        backgroundColor: const Color(0xFFFF6B35),
        child: Text(
          active?.displayName.isNotEmpty == true ? active!.displayName[0].toUpperCase() : 'P',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final active = _authService.currentAccount;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            Text(
              'पत्र',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w900, color: const Color(0xFFFF6B35), fontSize: 24),
            ),
            const SizedBox(width: 4),
            Text(
              _currentTab == 3 ? 'Unified Inbox' : 'Patr',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: _buildAvatar(),
          ),
        ],
      ),
      
      // Collapsible Left Drawer (Sidebar)
      drawer: Drawer(
        backgroundColor: const Color(0xFF070714),
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(color: Color(0xFF10101D)),
              accountName: Text(active?.displayName ?? 'User', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold)),
              accountEmail: Text(active?.email ?? '', style: GoogleFonts.plusJakartaSans(color: Colors.white54)),
              currentAccountPicture: CircleAvatar(
                backgroundColor: const Color(0xFFFF6B35),
                child: Text(
                  active?.displayName.isNotEmpty == true ? active!.displayName[0].toUpperCase() : 'U',
                  style: GoogleFonts.plusJakartaSans(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.inbox_outlined, color: Colors.white60),
              title: Text('Inbox', style: GoogleFonts.plusJakartaSans(color: Colors.white70)),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentTab = 0);
                _loadLocalEmails();
              },
            ),
            ListTile(
              leading: const Icon(Icons.star_outline, color: Colors.white60),
              title: Text('Starred', style: GoogleFonts.plusJakartaSans(color: Colors.white70)),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentTab = 1);
                _loadLocalEmails();
              },
            ),
            ListTile(
              leading: const Icon(Icons.send_outlined, color: Colors.white60),
              title: Text('Sent', style: GoogleFonts.plusJakartaSans(color: Colors.white70)),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentTab = 2);
                _loadLocalEmails();
              },
            ),
            ListTile(
              leading: const Icon(Icons.layers_outlined, color: Colors.white60),
              title: Text('Unified Feed', style: GoogleFonts.plusJakartaSans(color: Colors.white70)),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentTab = 3);
                _loadLocalEmails();
              },
            ),
            const Spacer(),
            const Divider(color: Colors.white10),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: Colors.redAccent),
              title: Text('Logout Account', style: GoogleFonts.plusJakartaSans(color: Colors.redAccent, fontWeight: FontWeight.bold)),
              onTap: () async {
                Navigator.pop(context);
                if (active != null) {
                  await _authService.removeAccount(active.uid);
                  _onAccountSwitched();
                }
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),

      body: RefreshIndicator(
        onRefresh: _handleRefresh,
        color: const Color(0xFFFF6B35),
        child: _isLoading && _emails.isEmpty
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF6B35)))
            : _emails.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                      Center(
                        child: Column(
                          children: [
                            Icon(Icons.mail_outline, size: 64, color: Colors.white24),
                            const SizedBox(height: 16),
                            Text(
                              'Koi naya patr nahi hai!',
                              style: GoogleFonts.plusJakartaSans(color: Colors.white38, fontSize: 16, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    itemCount: _emails.length,
                    separatorBuilder: (context, index) => const Divider(color: Colors.white10, height: 1),
                    itemBuilder: (context, index) {
                      final email = _emails[index];
                      final DateTime date = DateTime.fromMillisecondsSinceEpoch(email.timestamp);
                      final String dateStr = "${date.day}/${date.month}";

                      return ListTile(
                        onTap: () => _showEmailDetail(email),
                        leading: CircleAvatar(
                          backgroundColor: Colors.white.withValues(alpha: 0.04),
                          child: Text(
                            email.senderName.isNotEmpty ? email.senderName[0].toUpperCase() : 'U',
                            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold, color: Colors.white70),
                          ),
                        ),
                        title: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Sender name (bold if unread)
                            Expanded(
                              child: Text(
                                email.senderName,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontWeight: email.isUnread ? FontWeight.w900 : FontWeight.w600,
                                  fontSize: 14,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Date
                            Text(
                              dateStr,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                color: email.isUnread ? const Color(0xFFFF6B35) : Colors.white30,
                                fontWeight: email.isUnread ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            // Subject (bold if unread)
                            Text(
                              email.subject,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: email.isUnread ? FontWeight.w800 : FontWeight.w500,
                                fontSize: 13,
                                color: email.isUnread ? Colors.white.withValues(alpha: 0.9) : Colors.white60,
                              ),
                            ),
                            const SizedBox(height: 2),
                            // Snippet body
                            Text(
                              email.body,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                color: Colors.white30,
                              ),
                            ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: Icon(
                            email.isStarred ? Icons.star_rounded : Icons.star_border_rounded,
                            color: email.isStarred ? const Color(0xFFFF6B35) : Colors.white10,
                          ),
                          onPressed: () async {
                            await _dbService.toggleStar(active!.uid, email.id, email.isStarred);
                            _loadLocalEmails();
                          },
                        ),
                      );
                    },
                  ),
      ),

      // Floating Action Button - Compose
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const ComposeScreen()),
          );
          _loadLocalEmails();
        },
        backgroundColor: const Color(0xFFFF6B35),
        foregroundColor: Colors.white,
        child: const Icon(Icons.edit_rounded),
      ),

      // Bottom Navigation Bar
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTab,
        onTap: (index) {
          setState(() => _currentTab = index);
          _loadLocalEmails();
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF10101D),
        selectedItemColor: const Color(0xFFFF6B35),
        unselectedItemColor: Colors.white38,
        selectedLabelStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: GoogleFonts.plusJakartaSans(fontSize: 11),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.inbox_outlined),
            activeIcon: Icon(Icons.inbox),
            label: 'Inbox',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.star_outline),
            activeIcon: Icon(Icons.star),
            label: 'Starred',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.send_outlined),
            activeIcon: Icon(Icons.send),
            label: 'Sent',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.layers_outlined),
            activeIcon: Icon(Icons.layers),
            label: 'Unified',
          ),
        ],
      ),
    );
  }
}
