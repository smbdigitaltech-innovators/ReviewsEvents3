const { db } = require('../config/firebase');

class Notification {
    constructor(id, userId, title, message, type = 'info', read = false, timestamp = new Date().toISOString(), meta = {}) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type; // e.g., 'event_updated', 'event_canceled'
        this.read = read;
        this.timestamp = timestamp;
        this.meta = meta;
    }

    async save() {
        if (!this.id) {
            const ref = db.collection('notifications').doc();
            this.id = ref.id;
            await ref.set({ ...this });
            return this.id;
        } else {
            await db.collection('notifications').doc(this.id).set({ ...this }, { merge: true });
            return this.id;
        }
    }

    static async findByUser(userId, limit = 50) {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .limit(limit)
            .get();
        const items = snapshot.docs.map(doc => doc.data());
        // Sort by timestamp desc without requiring Firestore index
        return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    static async markAllRead(userId) {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();
    }
}

module.exports = Notification;


