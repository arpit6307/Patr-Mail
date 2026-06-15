import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';
import '../models/account_model.dart';

class AccountSwitcherDialog extends StatefulWidget {
  final AuthService authService;
  final VoidCallback onAccountSwitched;

  const AccountSwitcherDialog({
    super.key,
    required this.authService,
    required this.onAccountSwitched,
  });

  @override
  State<AccountSwitcherDialog> createState() => _AccountSwitcherDialogState();
}

class _AccountSwitcherDialogState extends State<AccountSwitcherDialog> {
  late List<AccountModel> _accounts;
  bool _isSwapping = false;

  @override
  void initState() {
    super.initState();
    _accounts = widget.authService.getCachedAccounts();
  }

  Future<void> _handleSwitch(AccountModel account) async {
    if (widget.authService.currentAccount?.uid == account.uid) {
      Navigator.pop(context); // Clicked on current active account
      return;
    }

    setState(() => _isSwapping = true);

    try {
      await widget.authService.switchAccount(account.uid);
      widget.onAccountSwitched();
      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Switch failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSwapping = false);
      }
    }
  }

  Future<void> _handleRemove(AccountModel account) async {
    try {
      await widget.authService.removeAccount(account.uid);
      setState(() {
        _accounts = widget.authService.getCachedAccounts();
      });
      
      // If no accounts left, go back to landing screen
      if (widget.authService.currentAccount == null) {
        if (mounted) {
          Navigator.pushNamedAndRemoveUntil(context, '/landing', (route) => false);
        }
      } else {
        widget.onAccountSwitched();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Remove failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.authService.currentAccount;
    
    return Dialog(
      backgroundColor: const Color(0xFF10101D), // Opaque solid color from PRD
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'पत्र ID Account Manager',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white60, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(color: Colors.white10),
            
            if (_isSwapping)
              Container(
                height: 120,
                alignment: Alignment.center,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(color: Color(0xFFFF6B35)),
                    const SizedBox(height: 16),
                    Text(
                      'Account Badla Ja Raha Hai...', // Centered Hindi Loader from PRD
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              )
            else ...[
              // List of cached accounts
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _accounts.length,
                  itemBuilder: (context, index) {
                    final account = _accounts[index];
                    final bool isActive = account.uid == active?.uid;
                    
                    return Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      decoration: BoxDecoration(
                        color: isActive ? Colors.white.withValues(alpha: 0.03) : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                        border: isActive 
                            ? Border.all(color: const Color(0xFFFF6B35).withValues(alpha: 0.2))
                            : null,
                      ),
                      child: ListTile(
                        onTap: () => _handleSwitch(account),
                        leading: CircleAvatar(
                          backgroundColor: isActive ? const Color(0xFFFF6B35) : Colors.white12,
                          child: Text(
                            account.displayName.isNotEmpty ? account.displayName[0].toUpperCase() : 'U',
                            style: GoogleFonts.plusJakartaSans(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        title: Text(
                          account.displayName,
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: Colors.white,
                          ),
                        ),
                        subtitle: Text(
                          account.email,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            color: Colors.white54,
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (isActive)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFF6B35).withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'ACTIVE',
                                  style: GoogleFonts.plusJakartaSans(
                                    color: const Color(0xFFFF6B35),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              )
                            else
                              IconButton(
                                icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                                onPressed: () => _handleRemove(account),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              
              const SizedBox(height: 12),
              const Divider(color: Colors.white10),
              const SizedBox(height: 8),

              // Button to add another account
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  Navigator.pushNamed(context, '/login'); // Redirect to login
                },
                icon: const Icon(Icons.add_circle_outline_rounded, size: 18),
                label: Text(
                  'Naya Patr ID Banao',
                  style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFFF6B35),
                  side: const BorderSide(color: Color(0xFFFF6B35)),
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
