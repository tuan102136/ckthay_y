import 'package:flutter/material.dart';

class DeviceCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const DeviceCard({
    super.key,
    required this.icon,
    required this.title,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(25),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.shade900,
              offset: const Offset(5.0, 5.0),
              blurRadius: 15.0,
              spreadRadius: 1.0,
            ),
            BoxShadow(
              color: Colors.white,
              offset: const Offset(-5.0, -5.0),
              blurRadius: 15.0,
              spreadRadius: 1.0,
            ),
          ],
        ),
        child: ListTile(
          leading: Icon(icon, color: Colors.grey[900]),
          title: Text(title, style: TextStyle(color: Colors.grey[900])),
          trailing: SizedBox(
            width: 100,
            child: Row(
              children: [
                // Edit button
                IconButton(onPressed: onEdit, icon: Icon(Icons.edit_outlined)),
                // Delete button
                IconButton(
                  onPressed: onDelete,
                  icon: Icon(Icons.delete_outlined),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
