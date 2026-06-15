import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';
import '../services/database_service.dart';

class ComposeScreen extends StatefulWidget {
  const ComposeScreen({super.key});

  @override
  State<ComposeScreen> createState() => _ComposeScreenState();
}

class _ComposeScreenState extends State<ComposeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _toController = TextEditingController();
  final _subjectController = TextEditingController();
  final _bodyController = TextEditingController();
  
  final _authService = AuthService();
  final _dbService = DatabaseService();

  bool _isSending = false;
  String _errorMessage = '';

  @override
  void dispose() {
    _toController.dispose();
    _subjectController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  Future<void> _handleSend() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSending = true;
      _errorMessage = '';
    });

    try {
      final active = _authService.currentAccount;
      if (active == null) throw Exception("Please login first");

      await _dbService.sendEmail(
        senderUid: active.uid,
        senderEmail: active.email,
        senderName: active.displayName,
        recipientEmail: _toController.text.trim().toLowerCase(),
        subject: _subjectController.text.trim(),
        body: _bodyController.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Patr safalta purvak bheja gaya!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = _authService.currentAccount;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Compose Patr',
          style: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isSending)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFFF6B35)),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.send_rounded, color: Color(0xFFFF6B35)),
              onPressed: _handleSend,
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_errorMessage.isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.1),
                      border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _errorMessage,
                      style: GoogleFonts.plusJakartaSans(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],

                // From Field
                Row(
                  children: [
                    SizedBox(
                      width: 50,
                      child: Text(
                        'From:',
                        style: GoogleFonts.plusJakartaSans(color: Colors.white54, fontWeight: FontWeight.w600),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        active?.email ?? 'Unknown sender',
                        style: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const Divider(color: Colors.white10, height: 24),

                // To Field
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 50,
                      child: Text(
                        'To:',
                        style: GoogleFonts.plusJakartaSans(color: Colors.white54, fontWeight: FontWeight.w600),
                      ),
                    ),
                    Expanded(
                      child: TextFormField(
                        controller: _toController,
                        style: GoogleFonts.plusJakartaSans(color: Colors.white, fontSize: 15),
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Recipient enter karein';
                          }
                          if (!value.trim().endsWith('@patr.in')) {
                            return 'Valid @patr.in email required';
                          }
                          return null;
                        },
                        decoration: InputDecoration(
                          hintText: 'username@patr.in',
                          hintStyle: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.2)),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(color: Colors.white10, height: 24),

                // Subject Field
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 80,
                      child: Text(
                        'Subject:',
                        style: GoogleFonts.plusJakartaSans(color: Colors.white54, fontWeight: FontWeight.w600),
                      ),
                    ),
                    Expanded(
                      child: TextFormField(
                        controller: _subjectController,
                        style: GoogleFonts.plusJakartaSans(color: Colors.white, fontSize: 15),
                        textCapitalization: TextCapitalization.sentences,
                        decoration: InputDecoration(
                          hintText: 'Jaise: Naya design check karo',
                          hintStyle: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.2)),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(color: Colors.white10, height: 24),
                const SizedBox(height: 12),

                // Body Text Field
                TextFormField(
                  controller: _bodyController,
                  maxLines: 15,
                  minLines: 8,
                  style: GoogleFonts.plusJakartaSans(color: Colors.white, fontSize: 15, height: 1.4),
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    hintText: 'Apna patr yahan likhein...',
                    hintStyle: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.2)),
                    border: InputBorder.none,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
