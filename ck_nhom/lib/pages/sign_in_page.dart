import 'package:flutter/material.dart';
import 'package:smart_home/auth/auth_service.dart';
import 'package:smart_home/pages/register_page.dart';
import 'package:smart_home/util/my_textfield.dart';
import 'package:smart_home/util/sign_in_button.dart';
import 'package:smart_home/util/square_tile.dart';

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  //get auth services
  final authService = AuthService();
  //text editing controllers
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  //login button pressed
  void login() async {
    final email = emailController.text.trim();
    final password = passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập email và mật khẩu.')),
      );
      return;
    }

    //attempt login..
    try {
      // await authService.signInWithEmailPassword(email, password);
      final response = await authService.signInWithEmailPassword(
        email,
        password,
      );
      if (response.session != null) {
        //login successful, the navigation is handles in AuthGate
      }
    }
    //catch any errors
    catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Error$e")));
      }
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  //UI
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Scaffold(
        backgroundColor: Colors.grey[300],
        body: SingleChildScrollView(
          child: SafeArea(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(height: 10),
                  //logo
                  Icon(Icons.lock_person, size: 150, color: Colors.grey[900]),

                  SizedBox(height: 25),

                  //Welcome back, you've been missed
                  Text(
                    "welcome back you've been missed!",
                    style: TextStyle(fontSize: 16, color: Colors.grey[700]),
                  ),

                  SizedBox(height: 25),
                  //username textfield
                  MyTextfield(
                    controller: emailController,
                    hintText: "Type your Email",
                    obscureText: false,
                    labelText: "Email",
                    prefixIcon: Icon(Icons.person, color: Colors.grey.shade700),
                  ),

                  SizedBox(height: 25),

                  //password textfield
                  MyTextfield(
                    controller: passwordController,
                    hintText: "Type your Password",
                    obscureText: true,
                    labelText: "Password",
                    prefixIcon: Icon(Icons.lock, color: Colors.grey.shade700),
                  ),
                  SizedBox(height: 15),

                  //forogt password? dumbass
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 25),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          'Forgot Password?',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ],
                    ),
                  ),

                  SizedBox(height: 35),

                  //sign in button
                  SignInButton(onTap: login, text: "Sign In"),

                  SizedBox(height: 25),

                  //or continue with
                  Row(
                    children: [
                      Expanded(
                        child: Divider(
                          thickness: 1,
                          color: Colors.grey.shade400,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          "Or Continue With",
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Divider(
                          thickness: 1,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),
                  //google + apple sign in buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      //google button
                      SquareTile(
                        imagePath:
                            'lib/assets/icons/Sign_In_Icons/google_normal.png',
                      ),

                      const SizedBox(width: 25),

                      //apple button
                      SquareTile(
                        imagePath:
                            'lib/assets/icons/Sign_In_Icons/Apple_Black.png',
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),

                  //don't have an account? Register Now
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("Not a member? "),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => RegisterPage(),
                          ),
                        ),
                        child: Text(
                          "Register now",
                          style: TextStyle(
                            color: Colors.blue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
