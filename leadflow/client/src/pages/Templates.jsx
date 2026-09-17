import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Edit,
  Trash2,
  Star,
  Eye,
  CheckCircle2,
  Tag,
  Sparkles,
} from 'lucide-react';
import { templateService } from '../services/templateService';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    isDefault: false,
  });

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await templateService.getTemplates();
      if (res.success) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error('Error fetching templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      subject: '',
      body: '',
      isDefault: false,
    });
    setShowModal(true);
  };

  const openEditModal = (tpl) => {
    setEditingId(tpl._id);
    setFormData({
      name: tpl.name,
      subject: tpl.subject,
      body: tpl.body,
      isDefault: tpl.isDefault,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await templateService.updateTemplate(editingId, formData);
      } else {
        await templateService.createTemplate(formData);
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await templateService.duplicateTemplate(id);
      fetchTemplates();
    } catch (err) {
      alert('Failed to duplicate template');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templateService.deleteTemplate(id);
        fetchTemplates();
      } catch (err) {
        alert('Failed to delete template');
      }
    }
  };

  const handleSetDefault = async (tpl) => {
    try {
      await templateService.updateTemplate(tpl._id, { isDefault: true });
      fetchTemplates();
    } catch (err) {
      alert('Failed to set default template');
    }
  };

  const handlePreview = async (tpl) => {
    try {
      setPreviewTemplate(tpl);
      const res = await templateService.previewTemplate({ templateId: tpl._id });
      if (res.success) {
        setPreviewResult(res.data);
      }
    } catch (err) {
      alert('Failed to render template preview');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Templates</h1>
          <p className="text-sm text-slate-500">
            Create high-converting outreach message templates with dynamic variable tags.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No templates yet</h3>
          <p className="text-xs text-slate-400 mt-1">Create your first cold pitch template above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl._id}
              className={`bg-white rounded-xl border p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md ${
                tpl.isDefault ? 'border-sky-300 ring-1 ring-sky-200' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <span>{tpl.name}</span>
                      {tpl.isDefault && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 text-sky-700 border border-sky-200">
                          DEFAULT
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Created: {new Date(tpl.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {!tpl.isDefault && (
                    <button
                      onClick={() => handleSetDefault(tpl)}
                      title="Set as Default Template"
                      className="text-xs font-medium text-slate-400 hover:text-sky-600 flex items-center space-x-1"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>Set Default</span>
                    </button>
                  )}
                </div>

                {/* Subject Preview */}
                <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-500">Subject: </span>
                  <span className="font-medium text-slate-800">{tpl.subject}</span>
                </div>

                {/* Body Excerpt */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 whitespace-pre-line font-sans">
                  {tpl.body}
                </p>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                <button
                  onClick={() => handlePreview(tpl)}
                  className="font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDuplicate(tpl._id)}
                    title="Duplicate Template"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(tpl)}
                    title="Edit Template"
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl._id)}
                    title="Delete Template"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 relative border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? 'Edit Email Template' : 'Create Email Template'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Website Pitch for Local Salons"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject Line (Supports Variables)
                </label>
                <input
                  type="text"
                  placeholder="Website for {{business_name}}"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-slate-800"
                  required
                />
              </div>

              {/* Variable Chips for inserting */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 mb-1 block">
                  Click to insert personalization tags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['business_name', 'contact_name', 'category', 'city', 'sender_name'].map(
                    (varTag) => (
                      <button
                        key={varTag}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, body: `${formData.body} {{${varTag}}}` })
                        }
                        className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 rounded"
                      >
                        {`{{${varTag}}}`}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Body</label>
                <textarea
                  rows={8}
                  placeholder="Write your email body..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg font-mono text-slate-800 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-sky-600"
                />
                <label htmlFor="defaultCheck" className="text-slate-700 font-medium">
                  Set as default template for new outreach
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-semibold"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewTemplate && previewResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <span>Preview: {previewTemplate.name}</span>
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <div>
                <span className="text-slate-400 font-semibold block">Subject:</span>
                <span className="font-bold text-slate-900">{previewResult.subject}</span>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <span className="text-slate-400 font-semibold block mb-1">Body:</span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {previewResult.body}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setPreviewTemplate(null);
                  setPreviewResult(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

