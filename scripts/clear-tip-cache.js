/**
 * Script to clear the weekly tip cache in local storage
 * Run this in the browser console to force a fresh fetch of tip data
 */

// Local storage keys used by the app
const TIP_STORAGE_KEY = 'vettly_weekly_tip';
const TIP_VIEW_STORAGE_KEY = 'vettly_tip_views';
const TIP_LAST_FETCH_KEY = 'vettly_tip_last_fetch';

// Clear the tip-related items from local storage
localStorage.removeItem(TIP_STORAGE_KEY);
localStorage.removeItem(TIP_LAST_FETCH_KEY);

console.log('Weekly tip cache cleared. The app will fetch fresh tip data on next load.');
