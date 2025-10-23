import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function EventCard({ event, onClick, small = false }) {
  const [live, setLive] = useState(event || {});

  useEffect(() => {
    const id = event?.id;
    if (!id) return undefined;
    const ref = doc(db, 'events', id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLive(prev => ({ ...prev, ...data }));
      }
    }, (err) => {
      console.error('EventCard: snapshot error', err);
    });
    return () => unsub();
  }, [event?.id]);

  const image = live.imageUrl || event?.imageUrl || event?.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(event?.category || 'event')}`;

  if (small) {
    return (
      <div className="flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg -m-2 transition-colors cursor-pointer" onClick={onClick}>
        <img alt={live.name || event?.name || 'Event'} className="w-16 h-16 object-cover rounded-lg" src={image} />
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-white">{live.name || event?.name}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{live.date ? new Date(live.date).toLocaleDateString() : (event?.date ? new Date(event.date).toLocaleDateString() : '')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden group flex flex-col shadow-sm cursor-pointer" onClick={onClick}>
      <div className="w-full aspect-video bg-cover bg-center overflow-hidden">
        <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url("${image}")` }} />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{live.name || event?.name}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-grow">{live.description || event?.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--primary-color)]">{live.date ? new Date(live.date).toLocaleDateString() : (event?.date ? new Date(event.date).toLocaleDateString() : '')}</span>
          <button className="text-slate-400 dark:text-slate-500 group-hover:text-[var(--primary-color)] transition-colors">
            <span className="material-symbols-outlined"> arrow_forward </span>
          </button>
        </div>
      </div>
    </div>
  );
}
