import { useState } from "react"
import { useAdminInstitutions, useAdminInstitution, useCreateInstitution, useUpdateInstitution, useDeleteInstitution, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "../../services/admin"
import type { AdminInstitution, AdminDepartment } from "@campus-connect/types"
import { Loader2, Plus, Edit3, Trash2, ChevronDown, ChevronRight, Building2, BookOpen } from "lucide-react"

export function AdminInstitutionsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState<"institution" | "department" | null>(null)
  const [editingInst, setEditingInst] = useState<{ id: string; name: string; type: string; state: string; acronym: string } | null>(null)
  const [editingDept, setEditingDept] = useState<{ id: string; name: string } | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("UNIVERSITY")
  const [formState, setFormState] = useState("")
  const [formAcronym, setFormAcronym] = useState("")
  const [formDeptName, setFormDeptName] = useState("")
  const [formDeptInstId, setFormDeptInstId] = useState("")

  const { data: institutions, isLoading } = useAdminInstitutions()
  const { data: expandedInst } = useAdminInstitution(expandedId ?? undefined)
  const createInst = useCreateInstitution()
  const updateInst = useUpdateInstitution()
  const deleteInst = useDeleteInstitution()
  const createDept = useCreateDepartment()
  const updateDept = useUpdateDepartment()
  const deleteDept = useDeleteDepartment()

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const resetForms = () => {
    setShowForm(null)
    setEditingInst(null)
    setEditingDept(null)
    setFormName("")
    setFormType("UNIVERSITY")
    setFormState("")
    setFormAcronym("")
    setFormDeptName("")
    setFormDeptInstId("")
  }

  const INSTITUTION_TYPES = [
    { value: "UNIVERSITY", label: "University" },
    { value: "POLYTECHNIC", label: "Polytechnic" },
    { value: "COLLEGE_OF_EDUCATION", label: "College of Education" },
    { value: "COLLEGE_OF_HEALTH", label: "College of Health" },
  ]

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => { resetForms(); setShowForm("institution") }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-geist font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Plus size={15} />
          Add School
        </button>
      </div>

      {/* Institutions List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : institutions?.length === 0 ? (
          <div className="p-16 text-center">
            <Building2 size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-geist font-bold">No institutions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {institutions?.map((inst: AdminInstitution) => (
              <div key={inst.id}>
                <div
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/40 dark:hover:bg-gray-850/30 transition-colors cursor-pointer"
                  onClick={() => handleToggleExpand(inst.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedId === inst.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{inst.name}</p>
                      <p className="text-xs text-gray-400">
                        {INSTITUTION_TYPES.find(t => t.value === inst.type)?.label || inst.type}
                        {inst.acronym && ` (${inst.acronym})`}
                        {inst.state && ` — ${inst.state}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-950 px-2 py-0.5 rounded-full border border-gray-150/50">
                      {inst._count.departments} depts
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingInst({ id: inst.id, name: inst.name, type: inst.type, state: inst.state || "", acronym: inst.acronym || "" }); setFormName(inst.name); setFormType(inst.type); setFormState(inst.state || ""); setFormAcronym(inst.acronym || "") }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${inst.name}" and all its departments?`)) deleteInst.mutate(inst.id, { onError: () => alert("Failed to delete institution. Please try again.") }) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded departments */}
                {expandedId === inst.id && (
                  <div className="bg-gray-50/30 dark:bg-gray-950/10 px-5 py-3 border-t border-gray-100 dark:border-gray-800 ml-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold font-geist text-gray-500 uppercase tracking-widest">Departments</p>
                      <button
                        onClick={() => { resetForms(); setShowForm("department"); setFormDeptInstId(inst.id) }}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>

                    {(!expandedInst?.departments || expandedInst.departments.length === 0) ? (
                      <p className="text-xs text-gray-400 py-2">No departments yet</p>
                    ) : (
                      <div className="space-y-1">
                        {expandedInst.departments.map((dept: AdminDepartment) => (
                          <div key={dept.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white dark:hover:bg-gray-900/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <BookOpen size={13} className="text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{dept.name}</span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingDept({ id: dept.id, name: dept.name })}
                                className="p-1 rounded text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => { if (confirm(`Delete department "${dept.name}"?`)) deleteDept.mutate(dept.id, { onError: () => alert("Failed to delete department. Please try again.") }) }}
                                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Institution Modal */}
      {(showForm === "institution" || editingInst) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={resetForms}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-geist font-bold text-lg text-on-surface mb-4">
              {editingInst ? "Edit School" : "Add New School"}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (editingInst) {
                await updateInst.mutateAsync({ id: editingInst.id, data: { name: formName || editingInst.name, type: formType || editingInst.type, state: formState || undefined, acronym: formAcronym || undefined } })
              } else {
                await createInst.mutateAsync({ name: formName, type: formType, state: formState || undefined, acronym: formAcronym || undefined })
              }
              resetForms()
            }} className="space-y-3">
              <div>
                <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">School Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="e.g. University of Lagos"
                />
              </div>
              <div>
                <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  {INSTITUTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">State</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="e.g. Lagos"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">Acronym</label>
                  <input
                    type="text"
                    value={formAcronym}
                    onChange={(e) => setFormAcronym(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="e.g. UNILAG"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForms} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
                  {editingInst ? "Save Changes" : "Create School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {showForm === "department" && !editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={resetForms}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-geist font-bold text-lg text-on-surface mb-4">Add Department</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              await createDept.mutateAsync({ institutionId: formDeptInstId, name: formDeptName })
              resetForms()
            }} className="space-y-3">
              <div>
                <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">Department Name</label>
                <input
                  type="text"
                  value={formDeptName}
                  onChange={(e) => setFormDeptName(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForms} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">Add Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditingDept(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-geist font-bold text-lg text-on-surface mb-4">Edit Department</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              await updateDept.mutateAsync({ id: editingDept.id, name: editingDept.name })
              setEditingDept(null)
            }} className="space-y-3">
              <div>
                <label className="text-xs font-bold font-geist text-gray-500 mb-1 block">Department Name</label>
                <input
                  type="text"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingDept(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
