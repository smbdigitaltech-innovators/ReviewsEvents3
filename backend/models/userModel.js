const { db, admin } = require('../config/firebase');

class User {
    constructor(id, name, email, password = null, preferences = [], attendedEvents = [], isAdmin = false, bio = '', interests = [], avatar = null) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password; // Hashed password (only if using internal auth, otherwise null)
        this.preferences = preferences;
        this.attendedEvents = attendedEvents;
        this.isAdmin = isAdmin; // Default to false
        this.bio = bio;
        this.interests = interests;
        this.avatar = avatar;
    }

    static async findByEmail(email) {
        const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (snapshot.empty) {
            return null;
        }
        const userData = snapshot.docs[0].data();
        return new User(userData.id, userData.name, userData.email, userData.password, userData.preferences, userData.attendedEvents, userData.isAdmin, userData.bio, userData.interests, userData.avatar);
    }

    static async findById(id) {
        const doc = await db.collection('users').doc(id).get();
        if (!doc.exists) {
            return null; // Return null if document not found
        }
        const userData = doc.data();
        return new User(userData.id, userData.name, userData.email, userData.password, userData.preferences, userData.attendedEvents, userData.isAdmin, userData.bio, userData.interests, userData.avatar);
    }

    async save() {
        const userRef = db.collection('users').doc(this.id);
        await userRef.set({ ...this }, { merge: true }); // Use merge for updates without overwriting
    }

    async addAttendedEvent(eventId) {
        const userRef = db.collection('users').doc(this.id);
        await userRef.update({
            attendedEvents: admin.firestore.FieldValue.arrayUnion(eventId)
        });
    }

    async removeAttendedEvent(eventId) {
        const userRef = db.collection('users').doc(this.id);
        await userRef.update({
            attendedEvents: admin.firestore.FieldValue.arrayRemove(eventId)
        });
    }

    // This method now accepts isAdmin to set the user's role in Firestore
    static async createProfileAfterAuth(uid, name, email, isAdmin = false) {
        const newUser = new User(uid, name, email, null, [], [], isAdmin);
        const userRef = db.collection('users').doc(uid);
        await userRef.set({ ...newUser, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        return newUser.id;
    }
}

module.exports = User;