"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useThemeContext } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import { 
  Button, 
  TextInput, 
  Badge, 
  Spinner, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeadCell, 
  TableRow 
} from "flowbite-react"
import {
  CodeBracketIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { DefaultCustomButton } from "@/components/ui/custom-button"
import { formatDate } from "@/utils/datetime-utils"
import { useProgrammingLanguage } from "@/hooks/programming-language/useProgrammingLanguage"
import type { ProgrammingLanguage } from "@/types/language"
import { useToast } from "@/hooks/useToast"
import LanguageDetail from "./language-detail"

export default function ProgrammingLanguagesManagement() {
  const { isDark } = useThemeContext()
  const toast = useToast()
  const {
    getAllProgrammingLanguages,
    syncProgrammingLanguages,
    updateProgrammingLanguage,
  } = useProgrammingLanguage()
  const [mounted, setMounted] = useState(false)
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage | null>(null)

  const fetchLanguages = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllProgrammingLanguages()
      setLanguages(data)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      console.error(err.response?.data?.message || 'Cannot load programming language list')
    } finally {
      setLoading(false)
    }
  }, [getAllProgrammingLanguages])

  useEffect(() => {
    setMounted(true)
    fetchLanguages()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.monaco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.extensions.some(ext => ext.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSync = async () => {
    try {
      setSyncing(true)
      await syncProgrammingLanguages()
      toast.showSuccess('Synced programming languages successfully')
      fetchLanguages()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.showError(err.response?.data?.message || 'Cannot sync programming languages')
    } finally {
      setSyncing(false)
    }
  }

  const handleViewDetail = (lang: ProgrammingLanguage) => {
    setSelectedLanguage(lang)
  }

  const handleBackToList = () => {
    setSelectedLanguage(null)
  }

  const handleUpdateLanguage = async (updatedLanguage: ProgrammingLanguage) => {
    try {
      const statusChanged = selectedLanguage?.status !== updatedLanguage.status
      if (statusChanged) {
        await updateProgrammingLanguage(updatedLanguage.id, { status: updatedLanguage.status })
      }
      toast.showSuccess(statusChanged ? 'Updated programming language successfully' : 'Updated successfully')
      setLanguages(prev => prev.map(lang =>
        lang.id === updatedLanguage.id ? updatedLanguage : lang
      ))
      setSelectedLanguage(updatedLanguage)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.showError(err.response?.data?.message || 'Cannot update programming language')
      throw error
    }
  }

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

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {selectedLanguage ? (
          <LanguageDetail 
            language={selectedLanguage} 
            onBack={handleBackToList}
            onUpdate={handleUpdateLanguage}
          />
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Manage Programming Languages
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage all programming languages in the system
              </p>
            </div>

            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <TextInput
                  type="text"
                  icon={MagnifyingGlassIcon}
                  placeholder="Search programming language..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <DefaultCustomButton
                label={syncing ? "Syncing..." : "Sync Languages"}
                icon={<ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />}
                onClick={handleSync}
                disabled={syncing}
              />
            </div>

            {/* Table */}
            <div className={`overflow-x-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <Spinner size="xl" />
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>ID</TableHeadCell>
                      <TableHeadCell>Language</TableHeadCell>
                      <TableHeadCell>Monaco</TableHeadCell>
                      <TableHeadCell>Extensions</TableHeadCell>
                      <TableHeadCell>Compilers</TableHeadCell>
                      <TableHeadCell>Status</TableHeadCell>
                      <TableHeadCell>Updated Date</TableHeadCell>
                      <TableHeadCell>Action</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLanguages.map((lang) => (
                      <TableRow key={lang.id} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleViewDetail(lang)}>
                        <TableCell className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                          <code className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                            {lang.id}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {lang.logoFileUrl ? (
                              <img src={lang.logoFileUrl} alt={lang.name} className="w-5 h-5" />
                            ) : (
                              <CodeBracketIcon className="w-5 h-5 text-green-600" />
                            )}
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                              {lang.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                            {lang.monaco}
                          </code>
                        </TableCell>
                        <TableCell className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                          <div className="flex flex-wrap gap-1">
                            {lang.extensions.slice(0, 3).map((ext, idx) => (
                              <Badge key={idx} color="info" size="sm">{ext}</Badge>
                            ))}
                            {lang.extensions.length > 3 && (
                              <Badge color="gray" size="sm">+{lang.extensions.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                          <Badge color="purple">{lang.compilers.length} compilers</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge color={getStatusColor(lang.status)}>
                            {lang.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                          {formatDate(lang.updatedDate)}
                        </TableCell>
                        <TableCell>
                          <Button className="cursor-pointer" size="xs" color="info" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleViewDetail(lang); }}>
                            View Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
