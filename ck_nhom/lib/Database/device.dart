class Device {
  int? id;
  String? content;

  Device({this.id, required this.content});

  // map to note : we convert to note so we can use it inside the app
  factory Device.fromMap(Map<String, dynamic> map) {
    return Device(id: map['id'], content: map['content'] as String);
  }

  // note to map : we converto to map so we can store it in the database
  Map<String, dynamic> toMap() {
    return {'content': content};
  }
}
