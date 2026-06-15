import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();

  // Step Controllers
  int _currentStep = 0; // 0 to 3
  bool _isLoading = false;
  String _errorMessage = '';

  // Step 1 Controllers
  final _patrAddressController = TextEditingController();
  final _nameController = TextEditingController();
  bool _usernameChecked = false;
  bool _usernameChecking = false;
  bool _usernameAvailable = false;
  List<String> _usernameSuggestions = [];

  // Step 2 Controllers
  final _phoneController = TextEditingController();
  bool _phoneChecking = false;

  // Step 3 Controllers
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  // Step 4 Controllers
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _patrAddressController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    for (var node in _otpFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  // Generate 3 username variations if taken
  void _generateSuggestions(String base) {
    setState(() {
      _usernameSuggestions = [
        '${base}2026',
        '${base}in',
        'patr$base',
      ];
    });
  }

  // Validate Username in Step 1
  Future<void> _checkUsername() async {
    final String val = _patrAddressController.text.trim().toLowerCase();
    if (val.isEmpty) return;

    setState(() {
      _usernameChecking = true;
      _errorMessage = '';
      _usernameSuggestions = [];
    });

    try {
      final isTaken = await _authService.isUsernameTaken(val);
      setState(() {
        _usernameChecked = true;
        _usernameAvailable = !isTaken;
        if (isTaken) {
          _generateSuggestions(val);
        }
      });
    } catch (e) {
      setState(() {
        _errorMessage = "Error checking username: $e";
      });
    } finally {
      setState(() {
        _usernameChecking = false;
      });
    }
  }

  // Handle step completion
  Future<void> _nextStep() async {
    setState(() => _errorMessage = '');

    if (_currentStep == 0) {
      // Step 1 validation
      if (_nameController.text.trim().isEmpty) {
        setState(() => _errorMessage = 'Full Name enter karein');
        return;
      }
      if (!_usernameChecked || !_usernameAvailable) {
        setState(() => _errorMessage = 'Please choose an available Patr ID');
        return;
      }
      setState(() => _currentStep = 1);
    } else if (_currentStep == 1) {
      // Step 2 validation
      final String phone = _phoneController.text.trim();
      if (phone.length < 10) {
        setState(() => _errorMessage = 'Valid 10-digit phone number enter karein');
        return;
      }
      
      setState(() => _phoneChecking = true);
      try {
        final isReg = await _authService.isPhoneRegistered('+91$phone');
        if (isReg) {
          setState(() {
            _errorMessage = 'Yeh mobile number pehle se registered hai';
            _phoneChecking = false;
          });
          return;
        }
        
        // Mock sending OTP
        setState(() {
          _phoneChecking = false;
          _currentStep = 2;
        });
      } catch (e) {
        setState(() {
          _errorMessage = 'Error checking phone: $e';
          _phoneChecking = false;
        });
      }
    } else if (_currentStep == 2) {
      // Step 3 validation (OTP code)
      final otp = _otpControllers.map((c) => c.text).join();
      if (otp.length < 6) {
        setState(() => _errorMessage = '6-digit OTP code enter karein');
        return;
      }
      // Success, move to final password step
      setState(() => _currentStep = 3);
    } else if (_currentStep == 3) {
      // Step 4 final registration
      final password = _passwordController.text;
      final confirm = _confirmPasswordController.text;

      if (password.length < 6) {
        setState(() => _errorMessage = 'Password minimum 6 characters ka hona chahiye');
        return;
      }
      if (password != confirm) {
        setState(() => _errorMessage = 'Password match nahi kar rahe hain');
        return;
      }

      _handleRegister();
    }
  }

  // Final submit registration to Firebase
  Future<void> _handleRegister() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      await _authService.register(
        patrAddress: _patrAddressController.text.trim().toLowerCase(),
        displayName: _nameController.text.trim(),
        phone: '+91${_phoneController.text.trim()}',
        password: _passwordController.text,
      );

      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false);
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
        _errorMessage = '';
      });
    } else {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: _prevStep,
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Step Progress Indicator
                Row(
                  children: List.generate(4, (index) {
                    final bool isPast = index < _currentStep;
                    final bool isCurrent = index == _currentStep;
                    return Expanded(
                      child: Container(
                        height: 4,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: isPast || isCurrent
                              ? const Color(0xFFFF6B35)
                              : Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 32),

                // Form Heading
                Text(
                  _currentStep == 0
                      ? 'Naya Patr ID\nBanao'
                      : _currentStep == 1
                          ? 'Phone Number\nVerify Karo'
                          : _currentStep == 2
                              ? 'OTP Code\nEnter Karo'
                              : 'Password\nSet Karo',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    height: 1.15,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),

                // Error Box
                if (_errorMessage.isNotEmpty)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.1),
                      border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      _errorMessage,
                      style: GoogleFonts.plusJakartaSans(
                        color: Colors.redAccent,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),

                // ── STEP RENDERER ──────────────────────────────
                if (_currentStep == 0) ..._buildStep1(),
                if (_currentStep == 1) ..._buildStep2(),
                if (_currentStep == 2) ..._buildStep3(),
                if (_currentStep == 3) ..._buildStep4(),

                const SizedBox(height: 40),

                // Step Navigation Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading || _phoneChecking ? null : _nextStep,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF6B35),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _isLoading || _phoneChecking
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Text(
                            _currentStep == 3 ? 'Account Banao' : 'Aage Badho',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // STEP 1: Patr ID & Full Name
  List<Widget> _buildStep1() {
    return [
      Text(
        'Full Name',
        style: GoogleFonts.plusJakartaSans(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.8)),
      ),
      const SizedBox(height: 8),
      TextFormField(
        controller: _nameController,
        style: GoogleFonts.plusJakartaSans(color: Colors.white),
        textCapitalization: TextCapitalization.words,
        decoration: InputDecoration(
          hintText: 'Jaise: Amit Verma',
          hintStyle: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.25)),
          filled: true,
          fillColor: Colors.white.withValues(alpha: 0.02),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFFF6B35))),
        ),
      ),
      const SizedBox(height: 24),
      Text(
        'Patr ID Banao',
        style: GoogleFonts.plusJakartaSans(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.8)),
      ),
      const SizedBox(height: 8),
      TextFormField(
        controller: _patrAddressController,
        style: GoogleFonts.plusJakartaSans(color: Colors.white),
        onChanged: (val) {
          setState(() {
            _usernameChecked = false;
            _usernameSuggestions = [];
          });
        },
        decoration: InputDecoration(
          hintText: 'username',
          suffixText: '@patr.in',
          suffixStyle: GoogleFonts.plusJakartaSans(color: const Color(0xFFFF6B35), fontWeight: FontWeight.bold),
          hintStyle: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.25)),
          filled: true,
          fillColor: Colors.white.withValues(alpha: 0.02),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFFF6B35))),
          suffixIcon: Container(
            margin: const EdgeInsets.only(right: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_usernameChecking)
                  const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                else if (_usernameChecked)
                  Icon(
                    _usernameAvailable ? Icons.check_circle_outline_rounded : Icons.cancel_outlined,
                    color: _usernameAvailable ? Colors.green : Colors.red,
                  ),
                IconButton(
                  icon: const Icon(Icons.search, size: 20),
                  onPressed: _checkUsername,
                ),
              ],
            ),
          ),
        ),
      ),
      if (_usernameChecked && !_usernameAvailable && _usernameSuggestions.isNotEmpty) ...[
        const SizedBox(height: 12),
        Text(
          'Username already taken! Inme se select karein:',
          style: GoogleFonts.plusJakartaSans(fontSize: 12, color: Colors.redAccent, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: _usernameSuggestions.map((s) {
            return ActionChip(
              label: Text(s),
              backgroundColor: const Color(0xFFFF6B35).withValues(alpha: 0.1),
              side: const BorderSide(color: Color(0xFFFF6B35), width: 0.5),
              labelStyle: GoogleFonts.plusJakartaSans(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
              onPressed: () {
                setState(() {
                  _patrAddressController.text = s;
                  _usernameChecked = true;
                  _usernameAvailable = true;
                  _usernameSuggestions = [];
                });
              },
            );
          }).toList(),
        ),
      ]
    ];
  }

  // STEP 2: Phone number
  List<Widget> _buildStep2() {
    return [
      Text(
        'Apna Phone Number enter karein verification ke liye.',
        style: GoogleFonts.plusJakartaSans(fontSize: 14, color: Colors.white.withValues(alpha: 0.5), fontWeight: FontWeight.w500),
      ),
      const SizedBox(height: 24),
      TextFormField(
        controller: _phoneController,
        style: GoogleFonts.plusJakartaSans(color: Colors.white),
        keyboardType: TextInputType.phone,
        maxLength: 10,
        decoration: InputDecoration(
          prefixText: '+91 ',
          prefixStyle: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.bold),
          hintText: '9876543210',
          hintStyle: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.25)),
          filled: true,
          fillColor: Colors.white.withValues(alpha: 0.02),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFFF6B35))),
          counterText: '',
        ),
      ),
    ];
  }

  // STEP 3: OTP confirmation
  List<Widget> _buildStep3() {
    return [
      Text(
        'Humne aapke number +91 ${_phoneController.text} par 6-digit verification code bheja hai.',
        style: GoogleFonts.plusJakartaSans(fontSize: 14, color: Colors.white.withValues(alpha: 0.5), fontWeight: FontWeight.w500),
      ),
      const SizedBox(height: 32),
      Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(6, (index) {
          return SizedBox(
            width: 45,
            child: TextFormField(
              controller: _otpControllers[index],
              focusNode: _otpFocusNodes[index],
              style: GoogleFonts.plusJakartaSans(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 1,
              onChanged: (value) {
                if (value.isNotEmpty && index < 5) {
                  _otpFocusNodes[index + 1].requestFocus();
                } else if (value.isEmpty && index > 0) {
                  _otpFocusNodes[index - 1].requestFocus();
                }
              },
              decoration: InputDecoration(
                counterText: '',
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.02),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFFF6B35), width: 1.5)),
              ),
            ),
          );
        }),
      ),
    ];
  }

  // STEP 4: Password Setup
  List<Widget> _buildStep4() {
    return [
      Text(
        'Apna account secure karne ke liye ek strong password set karein.',
        style: GoogleFonts.plusJakartaSans(fontSize: 14, color: Colors.white.withValues(alpha: 0.5), fontWeight: FontWeight.w500),
      ),
      const SizedBox(height: 24),
      Text(
        'Choose Password',
        style: GoogleFonts.plusJakartaSans(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.8)),
      ),
      const SizedBox(height: 8),
      TextFormField(
        controller: _passwordController,
        obscureText: _obscurePassword,
        style: GoogleFonts.plusJakartaSans(color: Colors.white),
        decoration: InputDecoration(
          hintText: 'Minimum 6 characters',
          hintStyle: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.25)),
          filled: true,
          fillColor: Colors.white.withValues(alpha: 0.02),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFFF6B35))),
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
              color: Colors.white.withValues(alpha: 0.4),
              size: 20,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
            },
          ),
        ),
      ),
      const SizedBox(height: 20),
      Text(
        'Confirm Password',
        style: GoogleFonts.plusJakartaSans(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.8)),
      ),
      const SizedBox(height: 8),
      TextFormField(
        controller: _confirmPasswordController,
        obscureText: _obscurePassword,
        style: GoogleFonts.plusJakartaSans(color: Colors.white),
        decoration: InputDecoration(
          hintText: 'Re-enter password',
          hintStyle: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.25)),
          filled: true,
          fillColor: Colors.white.withValues(alpha: 0.02),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFFF6B35))),
        ),
      ),
    ];
  }
}
