"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser } from '@/context/UserContext';
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Shield, Lock, Users, LogOut } from 'lucide-react'

export default function ProfilePage() {
    const router = useRouter();
    const { profile, updateProfile } = useUser();

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Profile & Identity</h3>
                    <p className="text-muted-foreground">
                        Manage your personal details, role, and security settings.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> User Details</CardTitle>
                        <CardDescription>Your personal and role information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={profile.name}
                                onChange={(e) => updateProfile({ name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Input
                                value={profile.jobTitle}
                                onChange={(e) => updateProfile({ jobTitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Team</Label>
                            <Input
                                value={profile.team}
                                onChange={(e) => updateProfile({ team: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Shield className="mr-2 h-5 w-5" /> Organization & Role</CardTitle>
                        <CardDescription>Context for policy enforcement.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Organization</Label>
                            <Input
                                value={profile.organization}
                                onChange={(e) => updateProfile({ organization: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>System Role</Label>
                            <Select
                                value={profile.systemRole}
                                onValueChange={(val: any) => updateProfile({ systemRole: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Viewer">Viewer</SelectItem>
                                    <SelectItem value="Reviewer">Reviewer</SelectItem>
                                    <SelectItem value="Policy Owner">Policy Owner</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Region</Label>
                            <Select
                                value={profile.region}
                                onValueChange={(val) => updateProfile({ region: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Global">Global</SelectItem>
                                    <SelectItem value="EU">EU (GDPR)</SelectItem>
                                    <SelectItem value="US">US</SelectItem>
                                    <SelectItem value="India">India</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Lock className="mr-2 h-5 w-5" /> Security</CardTitle>
                        <CardDescription>Account access controls.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>2FA Authentication</Label>
                                <p className="text-xs text-muted-foreground">Require code on login</p>
                            </div>
                            <Switch checked={true} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Session Timeout</Label>
                                <p className="text-xs text-muted-foreground">Auto-logout after 30m</p>
                            </div>
                            <Switch checked={true} />
                        </div>
                        <div className="pt-4 space-y-2">
                            <Button variant="outline" className="w-full">Change Password</Button>
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => router.push('/')}
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
