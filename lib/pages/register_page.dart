import 'package:flutter/material.dart';
import 'package:smart_home/auth/auth_service.dart';
import 'package:smart_home/util/my_textfield.dart';
import 'package:smart_home/util/sign_in_button.dart';

// import 'package:smart_home/util/square_tile.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  //get auth services
  final authService = AuthService();
  //text editing controllers
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  //sign up button pressed
  void signUp() async {
    //prepare data
    final email = emailController.text.trim();
    final password = passwordController.text;
    final confirmPassword = confirmPasswordController.text;

    if (email.isEmpty || password.isEmpty || confirmPassword.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập đầy đủ thông tin.')),
      );
      return;
    }

    //check if passwords match
    if (password != confirmPassword) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Passwords do not match")));
      }
      return;
    }
    //attempt sign up
    try {
      final response = await authService.signUpWithEmailPassword(
        email,
        password,
      );

      if (!mounted) return;
      final message = response.session == null
          ? 'Đăng ký thành công. Hãy xác nhận email rồi đăng nhập.'
          : 'Đăng ký thành công.';
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
      Navigator.pop(context);
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
    confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        iconTheme: IconThemeData(color: Colors.white),
        backgroundColor: Colors.grey[900],
        title: const Text(
          "Register Account",
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
      ),
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
                  "Create a new account with us",
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
                SizedBox(height: 25),

                //password textfield
                MyTextfield(
                  controller: confirmPasswordController,
                  hintText: "Re-write Password",
                  obscureText: true,
                  labelText: "Confirm Password",
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
                SignInButton(onTap: signUp, text: "Create Account"),

                SizedBox(height: 25),

                //or continue with
                // Row(
                //   children: [
                //     Expanded(
                //       child: Divider(thickness: 1, color: Colors.grey.shade400),
                //     ),
                //     Padding(
                //       padding: const EdgeInsets.symmetric(horizontal: 10),
                //       child: Text(
                //         "Or Continue With",
                //         style: TextStyle(
                //           fontSize: 14,
                //           color: Colors.grey.shade700,
                //         ),
                //       ),
                //     ),
                //     Expanded(
                //       child: Divider(thickness: 1, color: Colors.grey.shade400),
                //     ),
                //   ],
                // ),
                // const SizedBox(height: 30),
                // //google + apple sign in buttons
                // Row(
                //   mainAxisAlignment: MainAxisAlignment.center,
                //   children: [
                //     //google button
                //     SquareTile(
                //       imagePath:
                //           'lib/assets/icons/Sign_In_Icons/google_normal.png',
                //     ),

                //     const SizedBox(width: 25),

                //     //apple button
                //     SquareTile(
                //       imagePath: 'lib/assets/icons/Sign_In_Icons/Apple_Black.png',
                //     ),
                //   ],
                // ),
                // const SizedBox(height: 30),

                // //don't have an account? Register Now
                // Row(
                //   mainAxisAlignment: MainAxisAlignment.center,
                //   children: [
                //     Text("Not a member? "),
                //     const SizedBox(width: 4),
                //     GestureDetector(
                //       onTap: () => Navigator.push(
                //         context,
                //         MaterialPageRoute(builder: (context) => RegisterPage()),
                //       ),
                //       child: Text(
                //         "Register now",
                //         style: TextStyle(
                //           color: Colors.blue,
                //           fontWeight: FontWeight.bold,
                //         ),
                //       ),
                //     ),
                //   ],
                // ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
