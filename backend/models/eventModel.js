const { db } = require('../config/firebase');

class Event {
    constructor(id, name, description, category, date, location, createdBy, imageUrl) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
        this.date = date;
        this.location = location;
        this.createdBy = createdBy;
        this.imageUrl = imageUrl || null;
    }

    static async findById(id) {
        const doc = await db.collection('events').doc(id).get();
        if (!doc.exists) {
            return null;
        }
        const eventData = doc.data();
        return new Event(
            eventData.id,
            eventData.name,
            eventData.description,
            eventData.category,
            eventData.date,
            eventData.location,
            eventData.createdBy,
            eventData.imageUrl
        );
    }

    static async findAll(filters = {}) {
        let query = db.collection('events');

        if (filters.category) {
            query = query.where('category', '==', filters.category);
        }
        if (filters.date) {
            query = query.where('date', '==', filters.date);
        }
        if (filters.location) {
            query = query.where('location', '==', filters.location);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const eventData = doc.data();
            return new Event(
                eventData.id,
                eventData.name,
                eventData.description,
                eventData.category,
                eventData.date,
                eventData.location,
                eventData.createdBy,
                eventData.imageUrl
            );
        });
    }

    async save() {
        if (!this.id) {
            const newEventRef = db.collection('events').doc();
            this.id = newEventRef.id;
            await newEventRef.set({ ...this });
            return this.id;
        } else {
            const eventRef = db.collection('events').doc(this.id);
            await eventRef.update({ ...this });
            return this.id;
        }
    }

    async delete() {
        await db.collection('events').doc(this.id).delete();
    }
}

module.exports = Event;