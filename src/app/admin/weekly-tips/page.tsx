'use client';

import React, { useState, useEffect } from 'react';
import { WeeklyTip, WeeklyTipCategory, WeeklyTipStatus } from '@/lib/models/weeklyTip';
import { generateAndCreateTip, updateTip } from '@/lib/services/weeklyTipService';
import { ArticleSource } from '@/lib/services/openaiTipGenerator';
import { getAllTips, activateTip, archiveTip, deleteTip } from '@/lib/services/weeklyTipService';
import { format } from 'date-fns';

export default function WeeklyTipsAdmin() {
  const [tips, setTips] = useState<WeeklyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Article input state
  const [articleContent, setArticleContent] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WeeklyTipCategory>(WeeklyTipCategory.RELATIONSHIP_ADVICE);
  const [generating, setGenerating] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  
  // Edit state
  const [editingTip, setEditingTip] = useState<WeeklyTip | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Multi-select state
  const [selectedTips, setSelectedTips] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Load tips on component mount
  useEffect(() => {
    loadTips();
  }, []);
  
  // Function to load all tips
  const loadTips = async () => {
    try {
      setLoading(true);
      const allTips = await getAllTips();
      setTips(allTips);
      setError(null);
    } catch (err) {
      setError('Failed to load tips. Please try again.');
      console.error('Error loading tips:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle tip activation
  const handleActivate = async (tipId: string) => {
    try {
      await activateTip(tipId);
      loadTips(); // Reload tips after activation
    } catch (err) {
      setError('Failed to activate tip. Please try again.');
      console.error('Error activating tip:', err);
    }
  };
  
  // Function to handle tip publishing (combines approve and activate)
  const handlePublish = async (tipId: string) => {
    try {
      // First activate the tip
      await activateTip(tipId);
      loadTips(); // Reload tips after activation
      return true;
    } catch (err) {
      setError('Failed to publish tip. Please try again.');
      console.error('Error publishing tip:', err);
      return false;
    }
  };
  
  // Function to handle tip archiving
  const handleArchive = async (tipId: string) => {
    try {
      await archiveTip(tipId);
      loadTips(); // Reload tips after archiving
    } catch (err) {
      setError('Failed to archive tip. Please try again.');
      console.error('Error archiving tip:', err);
    }
  };
  
  // Function to handle single tip deletion
  const handleDelete = async (tipId: string) => {
    if (window.confirm('Are you sure you want to delete this tip? This action cannot be undone.')) {
      try {
        await deleteTip(tipId);
        loadTips(); // Reload tips after deletion
      } catch (err) {
        setError('Failed to delete tip. Please try again.');
        console.error('Error deleting tip:', err);
      }
    }
  };
  
  // Function to handle bulk deletion of selected tips
  const handleBulkDelete = async () => {
    const selectedCount = selectedTips.size;
    if (selectedCount === 0) {
      setError('No tips selected for deletion.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedCount} selected tip${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      try {
        setIsDeleting(true);
        setError(null);
        
        // Delete all selected tips sequentially
        const promises = Array.from(selectedTips).map(tipId => deleteTip(tipId));
        await Promise.all(promises);
        
        // Clear selection and reload tips
        setSelectedTips(new Set());
        loadTips();
      } catch (err) {
        setError('Failed to delete some tips. Please try again.');
        console.error('Error bulk deleting tips:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  // Function to handle tip selection toggle
  const handleSelectTip = (tipId: string) => {
    setSelectedTips(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(tipId)) {
        newSelection.delete(tipId);
      } else {
        newSelection.add(tipId);
      }
      return newSelection;
    });
  };
  
  // Function to toggle select all tips
  const handleSelectAll = () => {
    if (selectedTips.size === tips.length) {
      // If all are selected, deselect all
      setSelectedTips(new Set());
    } else {
      // Otherwise select all
      setSelectedTips(new Set(tips.map(tip => tip.id!)));
    }
  };
  
  // Function to generate a tip from an article
  const handleGenerateFromArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one of content or URL is provided
    if (!articleContent.trim() && !articleUrl.trim()) {
      setError('Either article content or URL must be provided.');
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      const articleSource: ArticleSource = {
        content: articleContent.trim() || '',
        title: articleTitle.trim() || undefined,
        url: articleUrl.trim() || undefined
      };
      
      const newTip = await generateAndCreateTip(selectedCategory, articleSource);
      
      // Reset form
      setArticleContent('');
      setArticleTitle('');
      setArticleUrl('');
      setShowArticleForm(false);
      
      // Open the edit form with the new tip
      setEditingTip(newTip);
      setShowEditForm(true);
      
      // Reload tips to show the new one
      loadTips();
    } catch (err) {
      setError('Failed to generate tip from article. Please try again.');
      console.error('Error generating tip:', err);
    } finally {
      setGenerating(false);
    }
  };
  
  // Function to handle editing a tip
  const handleEditTip = (tip: WeeklyTip) => {
    setEditingTip({...tip});
    setShowEditForm(true);
  };
  
  // Function to save edited tip
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTip || !editingTip.id) {
      setError('No tip selected for editing.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      await updateTip(editingTip.id, editingTip);
      
      // Reset form
      setEditingTip(null);
      setShowEditForm(false);
      
      // Reload tips to show the updated one
      loadTips();
    } catch (err) {
      setError('Failed to save tip. Please try again.');
      console.error('Error saving tip:', err);
    } finally {
      setSaving(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: any) => {
    try {
      if (!date) return 'N/A';
      
      // Handle Firestore timestamp
      if (typeof date === 'object' && date !== null) {
        if (date.toDate && typeof date.toDate === 'function') {
          return format(date.toDate(), 'dd/MM/yyyy');
        }
        if (date.seconds && typeof date.seconds === 'number') {
          return format(new Date(date.seconds * 1000), 'dd/MM/yyyy');
        }
      }
      
      return format(new Date(date), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: WeeklyTipStatus) => {
    switch (status) {
      case WeeklyTipStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case WeeklyTipStatus.APPROVED:
        return 'bg-blue-100 text-blue-800';
      case WeeklyTipStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case WeeklyTipStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      case WeeklyTipStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100 min-h-screen text-gray-800 overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Weekly Tips Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <button
          onClick={() => setShowArticleForm(!showArticleForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          {showArticleForm ? 'Hide Article Form' : 'Generate Tip from Article'}
        </button>
      </div>
      
      {showArticleForm && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Generate Tip from Article</h2>
          <form onSubmit={handleGenerateFromArticle}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="articleTitle">
                Article Title (Optional)
              </label>
              <input
                id="articleTitle"
                type="text"
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter article title"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="articleUrl">
                Article URL (Required if no content is provided)
              </label>
              <input
                id="articleUrl"
                type="text"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter article URL"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="articleContent">
                Article Content (Optional if URL is provided)
              </label>
              <textarea
                id="articleContent"
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={10}
                placeholder="Paste article content here"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                Category (Optional)
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as WeeklyTipCategory)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                {Object.values(WeeklyTipCategory).map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={generating || (!articleContent.trim() && !articleUrl.trim())}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  (generating || (!articleContent.trim() && !articleUrl.trim())) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {generating ? 'Generating...' : 'Generate Tip'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {showEditForm && editingTip && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6 max-w-4xl mx-auto overflow-y-auto" style={{ maxHeight: '80vh' }}>
          <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Tip</h2>
          <form onSubmit={handleSaveEdit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editTitle">
                Title
              </label>
              <input
                id="editTitle"
                type="text"
                value={editingTip.title}
                onChange={(e) => setEditingTip({...editingTip, title: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editShortDescription">
                Short Description
              </label>
              <textarea
                id="editShortDescription"
                value={editingTip.shortDescription}
                onChange={(e) => setEditingTip({...editingTip, shortDescription: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={2}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editContent">
                Main Content
              </label>
              <textarea
                id="editContent"
                value={editingTip.content}
                onChange={(e) => setEditingTip({...editingTip, content: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={8}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editWhyMatters">
                Why This Matters
              </label>
              <textarea
                id="editWhyMatters"
                value={editingTip.whyMatters || ''}
                onChange={(e) => setEditingTip({...editingTip, whyMatters: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editQuickTips">
                Quick Tips (one per line)
              </label>
              <textarea
                id="editQuickTips"
                value={editingTip.quickTips ? editingTip.quickTips.join('\n') : ''}
                onChange={(e) => {
                  const tips = e.target.value
                    .split('\n')
                    .map(tip => tip.trim().replace(/^[•\-*]\s*/, '')) // Remove bullet points if present
                    .filter(tip => tip.trim() !== '');
                  setEditingTip({...editingTip, quickTips: tips});
                }}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={5}
                placeholder="Enter one quick tip per line (bullet points will be added automatically)"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editDidYouKnow">
                Did You Know
              </label>
              <textarea
                id="editDidYouKnow"
                value={editingTip.didYouKnow || ''}
                onChange={(e) => setEditingTip({...editingTip, didYouKnow: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={2}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editWeeklyChallenge">
                Weekly Challenge
              </label>
              <textarea
                id="editWeeklyChallenge"
                value={editingTip.weeklyChallenge || ''}
                onChange={(e) => setEditingTip({...editingTip, weeklyChallenge: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={2}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editCategory">
                Category
              </label>
              <select
                id="editCategory"
                value={editingTip.category}
                onChange={(e) => setEditingTip({...editingTip, category: e.target.value as WeeklyTipCategory})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                {Object.values(WeeklyTipCategory).map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={saving}
                className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTip(null);
                  setShowEditForm(false);
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              {(editingTip.status === WeeklyTipStatus.PENDING || editingTip.status === WeeklyTipStatus.APPROVED) && (
                <button
                  type="button"
                  onClick={async () => {
                    if (editingTip.id) {
                      const success = await handlePublish(editingTip.id);
                      if (success) {
                        setEditingTip(null);
                        setShowEditForm(false);
                      }
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Publish Now
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">All Tips</h2>
          
          {selectedTips.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>Delete Selected ({selectedTips.size})</>
              )}
            </button>
          )}
        </div>
        
        {loading ? (
          <p>Loading tips...</p>
        ) : tips.length === 0 ? (
          <p>No tips found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white table-fixed">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={tips.length > 0 && selectedTips.size === tips.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tips.map((tip) => (
                  <tr key={tip.id} className={`hover:bg-gray-50 ${selectedTips.has(tip.id!) ? 'bg-blue-50' : ''}`}>
                    <td className="py-2 px-4 border-b border-gray-200 text-center">
                      <input
                        type="checkbox"
                        checked={selectedTips.has(tip.id!)}
                        onChange={() => handleSelectTip(tip.id!)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {tip.title}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {tip.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tip.status)}`}>
                        {tip.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {formatDate(tip.createdAt)}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {tip.publishedAt ? formatDate(tip.publishedAt) : 'Not published'}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditTip(tip)}
                          className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                        >
                          Edit
                        </button>
                        {tip.status === WeeklyTipStatus.APPROVED && (
                          <button
                            onClick={() => tip.id && handleActivate(tip.id)}
                            className="bg-green-500 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                          >
                            Activate
                          </button>
                        )}
                        {tip.status === WeeklyTipStatus.ACTIVE && (
                          <button
                            onClick={() => tip.id && handleArchive(tip.id)}
                            className="bg-gray-500 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => tip.id && handleDelete(tip.id)}
                          className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
