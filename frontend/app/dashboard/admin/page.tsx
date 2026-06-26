"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Shield, Users, RefreshCw, AlertTriangle, CheckCircle2, Crown } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useToast } from '@/components/ui/toast-context'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface UserRecord {
    uid: string
    email: string
    display_name: string
    role: string
    disabled: boolean
}

interface CurrentUser {
    uid: string
    email: string
    role: string
    permissions: {
        can_manage_users: boolean
    }
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN:     'bg-red-500/10 text-red-400 border-red-500/20',
    CISO:      'bg-purple-500/10 text-purple-400 border-purple-500/20',
    AUDITOR:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DEVELOPER: 'bg-green-500/10 text-green-400 border-green-500/20',
    VIEWER:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const ROLES = ['ADMIN', 'CISO', 'AUDITOR', 'DEVELOPER', 'VIEWER']

export default function AdminPage() {
    const { addToast } = useToast()
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [users, setUsers] = useState<UserRecord[]>([])
    const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState<string | null>(null)

    const getAuthHeader = useCallback(() => {
        // In dev mode (USE_FIREBASE=false) no token is required — the backend
        // returns a dev ADMIN context unconditionally. In production the token
        // is carried by the useUser context's firebase ID token.
        try {
            const token = localStorage.getItem('pg_id_token')
            return token ? { 'Authorization': `Bearer ${token}` } : {}
        } catch {
            return {}
        }
    }, [])

    const fetchCurrentUser = useCallback(async () => {
        try {
            const res = await fetch(`${API}/auth/me`, { headers: getAuthHeader() })
            if (!res.ok) {
                setAuthError('Authentication failed — are you signed in?')
                return
            }
            const data: CurrentUser = await res.json()
            if (!data.permissions.can_manage_users) {
                setAuthError(`Access denied. Your role (${data.role}) cannot manage users. Required: ADMIN.`)
                return
            }
            setCurrentUser(data)
        } catch {
            setAuthError('Could not connect to the backend.')
        }
    }, [getAuthHeader])

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API}/admin/users`, { headers: getAuthHeader() })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            setUsers(data.users ?? [])
        } catch (err) {
            addToast?.({ title: 'Failed to load users', description: String(err), variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [getAuthHeader, addToast])

    useEffect(() => {
        fetchCurrentUser().then(() => fetchUsers())
    }, [fetchCurrentUser, fetchUsers])

    const handleRoleChange = (uid: string, newRole: string) => {
        setPendingRoles(prev => ({ ...prev, [uid]: newRole }))
    }

    const saveRole = async (user: UserRecord) => {
        const newRole = pendingRoles[user.uid]
        if (!newRole || newRole === user.role) return

        setSaving(prev => ({ ...prev, [user.uid]: true }))
        try {
            const res = await fetch(`${API}/admin/users/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ uid: user.uid, role: newRole }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail ?? `HTTP ${res.status}`)
            }
            addToast?.({
                title: 'Role updated',
                description: `${user.email || user.uid} → ${newRole}. User must sign out and back in.`,
            })
            // Optimistically update local list
            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } : u))
            setPendingRoles(prev => { const n = { ...prev }; delete n[user.uid]; return n })
        } catch (err) {
            addToast?.({ title: 'Failed to update role', description: String(err), variant: 'destructive' })
        } finally {
            setSaving(prev => ({ ...prev, [user.uid]: false }))
        }
    }

    if (authError) {
        return (
            <div className="flex items-center justify-center h-64">
                <Card className="max-w-md w-full bg-red-500/5 border-red-500/20">
                    <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
                        <AlertTriangle className="text-red-400 w-8 h-8" />
                        <p className="text-sm text-red-400">{authError}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <Crown className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
                        <p className="text-sm text-muted-foreground">Manage user roles and access levels</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    className="gap-2"
                    disabled={loading}
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Current user info */}
            {currentUser && (
                <Card className="border-border/40 bg-card/30">
                    <CardContent className="pt-4 pb-4 flex items-center gap-3">
                        <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">
                            Signed in as <span className="text-foreground font-medium">{currentUser.email}</span>
                        </span>
                        <Badge className={cn('ml-1 text-xs border', ROLE_COLORS[currentUser.role] ?? ROLE_COLORS['VIEWER'])}>
                            {currentUser.role}
                        </Badge>
                    </CardContent>
                </Card>
            )}

            {/* Role guide */}
            <Card className="border-border/40 bg-card/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        Role hierarchy
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                        {[
                            { role: 'ADMIN',     desc: 'Full access + user management' },
                            { role: 'CISO',      desc: 'All governance; no user mgmt' },
                            { role: 'AUDITOR',   desc: 'Audit, evaluate, red-team' },
                            { role: 'DEVELOPER', desc: 'Evaluate + remediate own agents' },
                            { role: 'VIEWER',    desc: 'Read-only' },
                        ].map(({ role, desc }) => (
                            <div key={role} className={cn('rounded-md border px-2 py-1.5', ROLE_COLORS[role])}>
                                <div className="font-semibold">{role}</div>
                                <div className="opacity-70 mt-0.5">{desc}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Users table */}
            <Card className="border-border/40 bg-card/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        Users
                        <Badge variant="secondary" className="ml-1 text-xs">{users.length}</Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Role changes take effect after the user signs out and back in.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                            Loading users…
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {users.map(user => {
                                const pendingRole = pendingRoles[user.uid]
                                const hasChange = pendingRole && pendingRole !== user.role
                                const isSavingThis = saving[user.uid]

                                return (
                                    <div
                                        key={user.uid}
                                        className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/30 px-3 py-2.5"
                                    >
                                        {/* User info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-foreground truncate">
                                                    {user.email || user.uid}
                                                </span>
                                                {user.disabled && (
                                                    <Badge variant="destructive" className="text-xs">disabled</Badge>
                                                )}
                                            </div>
                                            {user.display_name && (
                                                <p className="text-xs text-muted-foreground truncate">{user.display_name}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground/60 font-mono">{user.uid}</p>
                                        </div>

                                        {/* Current role badge */}
                                        <Badge className={cn('text-xs border shrink-0', ROLE_COLORS[user.role] ?? ROLE_COLORS['VIEWER'])}>
                                            {user.role}
                                        </Badge>

                                        {/* Role selector */}
                                        <Select
                                            value={pendingRole ?? user.role}
                                            onValueChange={value => handleRoleChange(user.uid, value)}
                                        >
                                            <SelectTrigger className="w-32 h-8 text-xs shrink-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLES.map(r => (
                                                    <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {/* Save button */}
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs shrink-0"
                                            disabled={!hasChange || isSavingThis}
                                            onClick={() => saveRole(user)}
                                        >
                                            {isSavingThis ? (
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                            ) : hasChange ? (
                                                <>
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Save
                                                </>
                                            ) : (
                                                'Saved'
                                            )}
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
