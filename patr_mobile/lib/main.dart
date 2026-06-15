import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/auth_service.dart';
import 'screens/landing_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/main_screen.dart';

void main() async {
  // Ensure Flutter engine binding is initialized before native services
  WidgetsFlutterBinding.ensureInitialized();

  try {
    // Initialize Firebase (Uses google-services.json / GoogleService-Info.plist automatically)
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint("Firebase initialization info (Expected in dev without config): $e");
  }

  // Initialize Hive local NoSQL storage
  await Hive.initFlutter();

  // Open Hive Boxes for cached settings/credentials and email payload storage
  await Hive.openBox('settings');
  await Hive.openBox('emails_cache');

  // Initialize Auth Service
  final authService = AuthService();
  await authService.initUser();

  runApp(MyApp(authService: authService));
}

class MyApp extends StatelessWidget {
  final AuthService authService;

  const MyApp({super.key, required this.authService});

  @override
  Widget build(BuildContext context) {
    // Determine initial route based on whether user has cached active account
    final bool isLoggedIn = authService.currentAccount != null;

    return MaterialApp(
      title: 'Patr (पत्र)',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFFF6B35), // Brand Orange
        scaffoldBackgroundColor: const Color(0xFF070714), // Premium Dark Navy
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFF6B35),
          secondary: Color(0xFF138808), // Tricolor Green
          surface: Color(0xFF10101D), // Opaque dropdown color
        ),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          ThemeData.dark().textTheme,
        ),
      ),
      initialRoute: isLoggedIn ? '/main' : '/landing',
      routes: {
        '/landing': (context) => const LandingScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/main': (context) => const MainScreen(),
      },
    );
  }
}
