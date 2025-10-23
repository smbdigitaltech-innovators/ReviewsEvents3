import React, { useState } from 'react';
import { createEvent } from '../api/eventApi';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddEventModal = ({ isOpen, onClose, onSubmit }) => {
    const [eventData, setEventData] = useState({
        name: '',
        description: '',
        category: '',
        date: '',
        location: '',
        imageUrl: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEventData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
        }
    };

    const uploadImage = async () => {
        if (!imageFile) return null;
        
        const fileRef = ref(storage, `event-images/${Date.now()}-${imageFile.name}`);
        setUploading(true);
        
        try {
            const snapshot = await uploadBytes(fileRef, imageFile);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            return downloadUrl;
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Failed to upload image. Please try again.');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        try {
            let finalEventData = { ...eventData };
            if (imageFile) {
                const imageUrl = await uploadImage();
                if (imageUrl) {
                    finalEventData.imageUrl = imageUrl;
                } else {
                    return; // uploadImage already set the error
                }
            }
            
            await createEvent(finalEventData);
            setSuccess('Event created successfully!');
            setTimeout(() => {
                if (typeof onSubmit === 'function') {
                    onSubmit(finalEventData);
                }
                if (typeof onClose === 'function') {
                    onClose();
                }
            }, 1500); // Show success message for 1.5 seconds
        } catch (err) {
            console.error('Error creating event:', err);
            setError('Failed to create event. Please try again.');
        }
    };
    
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl m-4 transition-transform duration-300 scale-100 opacity-100">
        <div className="p-8">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Add New Event</h2>
            <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1 transition-colors duration-200">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="event-name">Event Name</label>
              <input className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm" 
                     id="event-name" name="name" placeholder="e.g. Summer Soundwave Music Festival" type="text" required 
                     value={eventData.name} onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="event-date">Date</label>
                <input className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm" 
                       id="event-date" name="date" type="date" required 
                       value={eventData.date} onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="event-location">Location</label>
                <input className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm" 
                       id="event-location" name="location" placeholder="e.g. Greenfield Park, CA" type="text" required 
                       value={eventData.location} onChange={handleInputChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="event-description">Description</label>
              <textarea className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm" 
                        id="event-description" name="description" placeholder="Tell us more about the event..." rows="4" required
                        value={eventData.description} onChange={handleInputChange}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="event-category">Category</label>
              <select className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm" 
                      id="event-category" name="category" 
                      value={eventData.category} onChange={handleInputChange}
              >
                <option>Music Festival</option>
                <option>Conference</option>
                <option>Workshop</option>
                <option>Art Exhibition</option>
                <option>Food & Drink</option>
                <option>Sports</option>
                <option>Technology</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Event Image</label>
              <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 px-6 pt-5 pb-6">
                <div className="space-y-1 text-center">
                  {imageFile ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={URL.createObjectURL(imageFile)} 
                        alt="Preview" 
                        className="h-32 w-32 object-cover rounded-lg mb-4"
                      />
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500">image</span>
                      <div className="flex text-sm text-slate-600 dark:text-slate-400">
                        <label className="relative cursor-pointer rounded-md font-medium text-[var(--primary-color)] hover:text-opacity-80 focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--primary-color)] focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-800" htmlFor="file-upload">
                          <span>Upload a file</span>
                          <input 
                            className="sr-only" 
                            id="file-upload" 
                            name="file-upload" 
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={uploading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
              {uploading && (
                <p className="mt-2 text-sm text-center text-slate-500 dark:text-slate-400">
                  Uploading image...
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-center text-sm mt-4">{error}</p>}
            {success && <p className="text-green-500 text-center text-sm mt-4">{success}</p>}
          </form>
          <div className="mt-8 flex justify-end gap-4">
            <button onClick={onClose} className="rounded-md border border-slate-300 dark:border-slate-600 bg-transparent py-2 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-200">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={uploading} className="flex justify-center rounded-md border border-transparent bg-[var(--primary-color)] py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-200">
              {uploading ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;