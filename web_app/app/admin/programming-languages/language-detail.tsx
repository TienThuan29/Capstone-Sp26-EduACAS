"use client"

import { useState } from "react"
import Image from "next/image"
import { useThemeContext } from "@/components/theme-provider"
import {
  Button,
  Badge,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from "flowbite-react"
import {
  CodeBracketIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import type { ProgrammingLanguage } from "@/types/language"
import { DefaultCustomButton } from "@/components/ui/custom-button"
import { formatDate } from "@/utils/datetime-utils"
import { useProgrammingLanguage } from "@/hooks/programming-language/useProgrammingLanguage"

interface LanguageDetailProps {
  language: ProgrammingLanguage
  onBack: () => void
  onUpdate: (language: ProgrammingLanguage) => Promise<void>
}

export default function LanguageDetail({ language, onBack, onUpdate }: LanguageDetailProps) {
  const { isDark } = useThemeContext()
  const { updateCompilerName } = useProgrammingLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    status: language.status,
  })
  const [saving, setSaving] = useState(false)
  const [editingCompilerId, setEditingCompilerId] = useState<string | null>(null)
  const [editingCompilerName, setEditingCompilerName] = useState("")
  const [savingCompilerId, setSavingCompilerId] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ENABLE':
        return 'success'
      case 'DISABLE':
        return 'failure'
      case 'MAINTAINANCE':
        return 'warning'
      default:
        return 'gray'
    }
  }

  const handleEdit = () => {
    setEditData({ status: language.status })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({ status: language.status })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const updatedLanguage = {
        ...language,
        status: editData.status,
      }
      await onUpdate(updatedLanguage)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating language:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleStartEditCompilerName = (compiler: { id: string; name: string }) => {
    setEditingCompilerId(compiler.id)
    setEditingCompilerName(compiler.name || "")
  }

  const handleCancelEditCompilerName = () => {
    setEditingCompilerId(null)
    setEditingCompilerName("")
  }

  const handleSaveCompilerName = async () => {
    if (editingCompilerId == null || editingCompilerName.trim() === "") {
      handleCancelEditCompilerName()
      return
    }
    try {
      setSavingCompilerId(editingCompilerId)
      const updated = await updateCompilerName(language.id, editingCompilerId, editingCompilerName.trim())
      await onUpdate(updated)
      handleCancelEditCompilerName()
    } catch (error) {
      console.error('Error updating compiler name:', error)
    } finally {
      setSavingCompilerId(null)
    }
  }

  return (
    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 cursor-pointer">
          <Button color="gray" size="sm" onClick={onBack} className="cursor-pointer">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {language.logoFileUrl ? (
              <Image src={language.logoFileUrl} alt={language.name} width={40} height={40} className="w-10 h-10" />
            ) : (
              <CodeBracketIcon className="w-10 h-10 text-green-600" />
            )}
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language.name}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                ID: {language.id}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button color="gray" size="sm" onClick={handleCancel} disabled={saving} className="cursor-pointer"  >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <DefaultCustomButton
                label={saving ? 'Saving...' : 'Save'}
                icon={<CheckIcon className="w-4 h-4" />}
                size="sm"
                onClick={handleSave}
                disabled={saving}
              />
            </>
          ) : (
            <DefaultCustomButton
              label="Edit"
              icon={<PencilIcon className="w-4 h-4" />}
              size="sm"
              onClick={handleEdit}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Basic Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="font-semibold text-sm">Monaco Editor</Label>
              <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <code className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  {language.monaco}
                </code>
              </p>
            </div>
            <div>
              <Label className="font-semibold text-sm">Formatter</Label>
              <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {language.formatter || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="font-semibold text-sm">Digit Separator</Label>
              <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {language.digitSeparator ? `"${language.digitSeparator}"` : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="font-semibold text-sm">Status</Label>
              <div className="mt-1">
                {isEditing ? (
                  <Select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-40"
                  >
                    <option value="ENABLE">ENABLE</option>
                    <option value="DISABLE">DISABLE</option>
                    <option value="MAINTAINANCE">MAINTAINANCE</option>
                  </Select>
                ) : (
                  <Badge color={getStatusColor(language.status)}>{language.status}</Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="font-semibold text-sm">Created Date</Label>
              <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatDate(language.createdDate)}
              </p>
            </div>
            <div>
              <Label className="font-semibold text-sm">Updated Date</Label>
              <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatDate(language.updatedDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Extensions */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            File Extensions ({language.extensions.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {language.extensions.map((ext, idx) => (
              <Badge key={idx} color="info" size="lg">{ext}</Badge>
            ))}
          </div>
        </div>

        {/* Compilers */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Compilers ({language.compilers.length})
          </h3>
          {language.compilers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>ID</TableHeadCell>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Group</TableHeadCell>
                    <TableHeadCell>Std Versions</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {language.compilers.map((compiler) => (
                    <TableRow key={compiler.id}>
                      <TableCell>
                        <code className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>
                          {compiler.id}
                        </code>
                      </TableCell>
                      <TableCell className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {editingCompilerId === compiler.id ? (
                          <div className="flex items-center gap-2">
                            <TextInput
                              value={editingCompilerName}
                              onChange={(e) => setEditingCompilerName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCompilerName()
                                if (e.key === 'Escape') handleCancelEditCompilerName()
                              }}
                              disabled={savingCompilerId === compiler.id}
                              className="min-w-[120px]"
                              autoFocus
                            />
                            <Button size="xs" color="gray" onClick={handleCancelEditCompilerName} disabled={savingCompilerId === compiler.id}>
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                            <Button size="xs" color="success" onClick={() => handleSaveCompilerName()} disabled={savingCompilerId === compiler.id || !editingCompilerName.trim()}>
                              {savingCompilerId === compiler.id ? '...' : <CheckIcon className="w-4 h-4" />}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span>{compiler.name || 'N/A'}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditCompilerName(compiler)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-blue-500 cursor-pointer"
                              title="Edit compiler name"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge color="purple">{compiler.group}</Badge>
                      </TableCell>
                      <TableCell>
                        {compiler.stdVersions && compiler.stdVersions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {compiler.stdVersions.map((v, i) => (
                              <Badge key={i} color="gray" size="sm">{v}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No compilers available</p>
          )}
        </div>
      </div>
    </div>
  )
}
