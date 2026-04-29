"use client";

import {
  Github,
  Instagram,
  Linkedin,
  Mail,
  Pencil,
  Plus,
  Trash2,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CloudinaryUpload } from "~/components/cloudinary-upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  TEAM_COMMITTEES,
  type TeamCommittee,
} from "~/lib/constants/team-committees";

type SocialLinks = {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  email?: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  committee: TeamCommittee;
  photo: string | null;
  cloudinaryId: string | null;
  socialLinks: SocialLinks;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FacultyMember = {
  id: string;
  name: string;
  designation: string;
  department: string;
  photo: string | null;
  cloudinaryId: string | null;
  socialLinks: SocialLinks;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type TeamMemberFormState = {
  name: string;
  role: string;
  committee: TeamCommittee;
  photo?: string;
  cloudinaryId?: string;
  socialLinks: SocialLinks;
  order: number;
  isActive: boolean;
};

type FacultyFormState = {
  name: string;
  designation: string;
  department: string;
  photo?: string;
  cloudinaryId?: string;
  socialLinks: SocialLinks;
  order: number;
  isActive: boolean;
};

const getInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("");
};

const EMPTY_FORM: TeamMemberFormState = {
  name: "",
  role: "",
  committee: TEAM_COMMITTEES[0],
  photo: "",
  cloudinaryId: "",
  socialLinks: {
    linkedin: "",
    github: "",
    twitter: "",
    instagram: "",
    email: "",
  },
  order: 0,
  isActive: true,
};

const EMPTY_FACULTY_FORM: FacultyFormState = {
  name: "",
  designation: "",
  department: "",
  photo: "",
  cloudinaryId: "",
  socialLinks: {
    linkedin: "",
    github: "",
    twitter: "",
    instagram: "",
    email: "",
  },
  order: 0,
  isActive: true,
};

export function ManageTeamsTab() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFacultyLoading, setIsFacultyLoading] = useState(true);

  const [committeeFilter, setCommitteeFilter] = useState<string>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamMemberFormState>(EMPTY_FORM);

  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isFacultyFormOpen, setIsFacultyFormOpen] = useState(false);
  const [isFacultySaving, setIsFacultySaving] = useState(false);
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);
  const [facultyForm, setFacultyForm] =
    useState<FacultyFormState>(EMPTY_FACULTY_FORM);
  const [facultyToDelete, setFacultyToDelete] = useState<FacultyMember | null>(
    null,
  );

  const filteredMembers = useMemo(() => {
    const sorted = [...members].sort((a, b) => {
      if (a.committee === b.committee) {
        if (a.order === b.order) {
          return a.name.localeCompare(b.name);
        }
        return a.order - b.order;
      }
      return a.committee.localeCompare(b.committee);
    });

    if (committeeFilter === "all") {
      return sorted;
    }

    return sorted.filter((member) => member.committee === committeeFilter);
  }, [members, committeeFilter]);

  const parseApiError = async (res: Response, fallback: string) => {
    try {
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        description?: string;
      };

      return data.message || data.error || data.description || fallback;
    } catch {
      return fallback;
    }
  };

  const extractTreeifiedErrorMessage = (errors: unknown): string | null => {
    if (!errors || typeof errors !== "object") {
      return null;
    }

    const queue: unknown[] = [errors];
    while (queue.length > 0) {
      const current = queue.shift();

      if (!current || typeof current !== "object") {
        continue;
      }

      if (
        "errors" in current &&
        Array.isArray((current as { errors?: unknown[] }).errors)
      ) {
        const messages = (current as { errors: unknown[] }).errors.filter(
          (item): item is string => typeof item === "string",
        );

        if (messages.length > 0) {
          return messages[0];
        }
      }

      for (const value of Object.values(current)) {
        if (value && typeof value === "object") {
          queue.push(value);
        }
      }
    }

    return null;
  };

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/teams", {
        credentials: "include",
      });
      if (!res.ok) {
        const errorMessage = await parseApiError(
          res,
          "Failed to load team members",
        );
        throw new Error(errorMessage);
      }
      const data = (await res.json()) as { members: TeamMember[] };
      setMembers(data.members ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch team members");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      setIsFacultyLoading(true);
      const res = await fetch("/api/admin/faculty", {
        credentials: "include",
      });

      if (!res.ok) {
        const errorMessage = await parseApiError(
          res,
          "Failed to load faculty members",
        );
        throw new Error(errorMessage);
      }

      const data = (await res.json()) as { faculty: FacultyMember[] };
      setFacultyMembers(data.faculty ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch faculty members");
    } finally {
      setIsFacultyLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch once on mount
  useEffect(() => {
    fetchMembers();
    fetchFaculty();
  }, []);

  const openCreateModal = () => {
    setEditingMemberId(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setForm({
      name: member.name,
      role: member.role,
      committee: member.committee,
      photo: member.photo ?? "",
      cloudinaryId: member.cloudinaryId ?? "",
      socialLinks: {
        linkedin: member.socialLinks.linkedin ?? "",
        github: member.socialLinks.github ?? "",
        twitter: member.socialLinks.twitter ?? "",
        instagram: member.socialLinks.instagram ?? "",
        email: member.socialLinks.email ?? "",
      },
      order: member.order,
      isActive: member.isActive,
    });
    setIsFormOpen(true);
  };

  const upsertMember = (member: TeamMember) => {
    setMembers((prev) => {
      const exists = prev.some((item) => item.id === member.id);
      if (exists) {
        return prev.map((item) => (item.id === member.id ? member : item));
      }
      return [member, ...prev];
    });
  };

  const upsertFaculty = (faculty: FacultyMember) => {
    setFacultyMembers((prev) => {
      const exists = prev.some((item) => item.id === faculty.id);
      if (exists) {
        return prev.map((item) => (item.id === faculty.id ? faculty : item));
      }
      return [faculty, ...prev];
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Name and role are required");
      return;
    }

    setIsSaving(true);
    const requestStart = performance.now();

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        role: form.role.trim(),
      };

      const endpoint = editingMemberId
        ? `/api/admin/teams/${editingMemberId}`
        : "/api/admin/teams";
      const method = editingMemberId ? "PUT" : "POST";

      console.info("[ManageTeams] Save member started", {
        mode: editingMemberId ? "update" : "create",
        endpoint,
        method,
      });

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const rawResponse = await res.text();
        let parsedError: {
          message?: string;
          error?: string;
          description?: string;
          errors?: unknown;
        } | null = null;

        try {
          parsedError = rawResponse
            ? (JSON.parse(rawResponse) as {
                message?: string;
                error?: string;
                description?: string;
              })
            : null;
        } catch {
          parsedError = null;
        }

        const errorMessage =
          extractTreeifiedErrorMessage(parsedError?.errors) ||
          parsedError?.message ||
          parsedError?.error ||
          parsedError?.description ||
          "Failed to save member";

        console.error("[ManageTeams] Save member request failed", {
          mode: editingMemberId ? "update" : "create",
          status: res.status,
          statusText: res.statusText,
          durationMs: Math.round(performance.now() - requestStart),
          response: parsedError,
          rawResponse,
        });

        throw new Error(errorMessage);
      }

      const data = (await res.json()) as { member?: TeamMember };

      if (!data.member) {
        throw new Error("Failed to save member");
      }

      upsertMember(data.member);
      console.info("[ManageTeams] Save member succeeded", {
        mode: editingMemberId ? "update" : "create",
        durationMs: Math.round(performance.now() - requestStart),
        memberId: data.member.id,
      });
      toast.success(editingMemberId ? "Member updated" : "Member added");
      setIsFormOpen(false);
      setEditingMemberId(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error("[ManageTeams] Save member crashed", {
        mode: editingMemberId ? "update" : "create",
        durationMs: Math.round(performance.now() - requestStart),
        error,
      });
      toast.error(
        error instanceof Error ? error.message : "Failed to save member",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    try {
      const res = await fetch(`/api/admin/teams/${member.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorMessage = await parseApiError(
          res,
          "Failed to delete member",
        );
        throw new Error(errorMessage);
      }

      setMembers((prev) => prev.filter((item) => item.id !== member.id));
      toast.success("Member deleted");
      setMemberToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete member",
      );
    }
  };

  const handleToggle = async (member: TeamMember) => {
    setMembers((prev) =>
      prev.map((item) =>
        item.id === member.id ? { ...item, isActive: !item.isActive } : item,
      ),
    );

    try {
      const res = await fetch(`/api/admin/teams/${member.id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        const errorMessage = await parseApiError(
          res,
          "Failed to update status",
        );
        throw new Error(errorMessage);
      }

      const data = (await res.json()) as { member?: TeamMember };

      if (!data.member) {
        throw new Error("Failed to update status");
      }

      upsertMember(data.member);
      toast.success("Status updated");
    } catch (error) {
      console.error(error);
      setMembers((prev) =>
        prev.map((item) =>
          item.id === member.id ? { ...item, isActive: member.isActive } : item,
        ),
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    }
  };

  const setSocial = (key: keyof SocialLinks, value: string) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: value,
      },
    }));
  };

  const setFacultySocial = (key: keyof SocialLinks, value: string) => {
    setFacultyForm((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: value,
      },
    }));
  };

  const openFacultyCreateModal = () => {
    setEditingFacultyId(null);
    setFacultyForm(EMPTY_FACULTY_FORM);
    setIsFacultyFormOpen(true);
  };

  const openFacultyEditModal = (faculty: FacultyMember) => {
    setEditingFacultyId(faculty.id);
    setFacultyForm({
      name: faculty.name,
      designation: faculty.designation,
      department: faculty.department,
      photo: faculty.photo ?? "",
      cloudinaryId: faculty.cloudinaryId ?? "",
      socialLinks: {
        linkedin: faculty.socialLinks.linkedin ?? "",
        github: faculty.socialLinks.github ?? "",
        twitter: faculty.socialLinks.twitter ?? "",
        instagram: faculty.socialLinks.instagram ?? "",
        email: faculty.socialLinks.email ?? "",
      },
      order: faculty.order,
      isActive: faculty.isActive,
    });
    setIsFacultyFormOpen(true);
  };

  const handleFacultySubmit = async () => {
    if (!facultyForm.name.trim() || !facultyForm.designation.trim()) {
      toast.error("Faculty name and designation are required");
      return;
    }

    if (!facultyForm.department.trim()) {
      toast.error("Faculty department is required");
      return;
    }

    setIsFacultySaving(true);
    const requestStart = performance.now();

    try {
      const payload = {
        ...facultyForm,
        name: facultyForm.name.trim(),
        designation: facultyForm.designation.trim(),
        department: facultyForm.department.trim(),
      };

      // Clean empty social links
      if (payload.socialLinks) {
        Object.keys(payload.socialLinks).forEach((key) => {
          if (!payload.socialLinks[key as keyof SocialLinks]) {
            delete payload.socialLinks[key as keyof SocialLinks];
          }
        });
      }

      // Clean empty optional fields
      if (!payload.photo) {
        delete payload.photo;
      }
      if (!payload.cloudinaryId) {
        delete payload.cloudinaryId;
      }

      const endpoint = editingFacultyId
        ? `/api/admin/faculty/${editingFacultyId}`
        : "/api/admin/faculty";
      const method = editingFacultyId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const rawResponse = await res.text();
        let parsedError: {
          message?: string;
          error?: string;
          description?: string;
          errors?: unknown;
        } | null = null;

        try {
          parsedError = rawResponse
            ? (JSON.parse(rawResponse) as {
                message?: string;
                error?: string;
                description?: string;
              })
            : null;
        } catch {
          parsedError = null;
        }

        const errorMessage =
          extractTreeifiedErrorMessage(parsedError?.errors) ||
          parsedError?.message ||
          parsedError?.error ||
          parsedError?.description ||
          "Failed to save faculty member";

        console.error("[ManageTeams] Save faculty request failed", {
          mode: editingFacultyId ? "update" : "create",
          status: res.status,
          statusText: res.statusText,
          durationMs: Math.round(performance.now() - requestStart),
          response: parsedError,
          rawResponse,
        });

        throw new Error(errorMessage);
      }

      const data = (await res.json()) as { faculty?: FacultyMember };

      if (!data.faculty) {
        throw new Error("Failed to save faculty member");
      }

      upsertFaculty(data.faculty);
      toast.success(editingFacultyId ? "Faculty updated" : "Faculty added");
      setIsFacultyFormOpen(false);
      setEditingFacultyId(null);
      setFacultyForm(EMPTY_FACULTY_FORM);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save faculty member";

      console.error("[ManageTeams] Save faculty crashed", {
        mode: editingFacultyId ? "update" : "create",
        durationMs: Math.round(performance.now() - requestStart),
        errorMessage,
      });
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }

      toast.error(errorMessage);
    } finally {
      setIsFacultySaving(false);
    }
  };

  const handleFacultyDelete = async (faculty: FacultyMember) => {
    try {
      const res = await fetch(`/api/admin/faculty/${faculty.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorMessage = await parseApiError(
          res,
          "Failed to delete faculty member",
        );
        throw new Error(errorMessage);
      }

      setFacultyMembers((prev) =>
        prev.filter((item) => item.id !== faculty.id),
      );
      toast.success("Faculty member deleted");
      setFacultyToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete faculty member",
      );
    }
  };

  const handleFacultyToggle = async (faculty: FacultyMember) => {
    setFacultyMembers((prev) =>
      prev.map((item) =>
        item.id === faculty.id ? { ...item, isActive: !item.isActive } : item,
      ),
    );

    try {
      const res = await fetch(`/api/admin/faculty/${faculty.id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        const errorMessage = await parseApiError(
          res,
          "Failed to update faculty status",
        );
        throw new Error(errorMessage);
      }

      const data = (await res.json()) as { faculty?: FacultyMember };

      if (!data.faculty) {
        throw new Error("Failed to update faculty status");
      }

      upsertFaculty(data.faculty);
      toast.success("Faculty status updated");
    } catch (error) {
      console.error(error);
      setFacultyMembers((prev) =>
        prev.map((item) =>
          item.id === faculty.id
            ? { ...item, isActive: faculty.isActive }
            : item,
        ),
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update faculty status",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Teams</h2>
          <p className="text-muted-foreground">
            Add, edit, and organize committee members shown on the public teams
            page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchMembers}>
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={committeeFilter === "all" ? "default" : "outline"}
          onClick={() => setCommitteeFilter("all")}
        >
          All Committees
        </Button>
        {TEAM_COMMITTEES.map((committee) => (
          <Button
            key={committee}
            variant={committeeFilter === committee ? "default" : "outline"}
            onClick={() => setCommitteeFilter(committee)}
          >
            {committee}
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Committee</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Social Links</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-30 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading team members...
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {member.photo ? (
                        <Image
                          src={member.photo}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover border"
                          unoptimized
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full border bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {getInitials(member.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.committee}</TableCell>
                  <TableCell>{member.order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {member.socialLinks.linkedin ? (
                        <Linkedin className="h-4 w-4" />
                      ) : null}
                      {member.socialLinks.github ? (
                        <Github className="h-4 w-4" />
                      ) : null}
                      {member.socialLinks.twitter ? (
                        <Twitter className="h-4 w-4" />
                      ) : null}
                      {member.socialLinks.instagram ? (
                        <Instagram className="h-4 w-4" />
                      ) : null}
                      {member.socialLinks.email ? (
                        <Mail className="h-4 w-4" />
                      ) : null}
                      {Object.values(member.socialLinks).filter(Boolean)
                        .length === 0 ? (
                        <span className="text-xs">-</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={member.isActive}
                        onCheckedChange={() => handleToggle(member)}
                      />
                      <Badge
                        variant={member.isActive ? "success" : "secondary"}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setMemberToDelete(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMemberId ? "Edit Member" : "Add Team Member"}
            </DialogTitle>
            <DialogDescription>
              Update committee details and social links for the teams page.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="member-name">Name</Label>
              <Input
                id="member-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <Input
                id="member-role"
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Committee</Label>
              <Select
                value={form.committee}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    committee: value as TeamCommittee,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select committee" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_COMMITTEES.map((committee) => (
                    <SelectItem key={committee} value={committee}>
                      {committee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-order">Display Order</Label>
              <Input
                id="member-order"
                type="number"
                min={0}
                value={form.order}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    order: Number(e.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Photo</Label>
              <div className="flex flex-wrap items-center gap-3">
                <CloudinaryUpload
                  label={form.photo ? "Replace Photo" : "Upload Photo"}
                  folder="teams"
                  onUpload={(url) =>
                    setForm((prev) => ({
                      ...prev,
                      photo: url,
                    }))
                  }
                  onUploadInfo={({ publicId }) =>
                    setForm((prev) => ({
                      ...prev,
                      cloudinaryId: publicId ?? prev.cloudinaryId,
                    }))
                  }
                />
                {form.photo ? (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        photo: "",
                        cloudinaryId: "",
                      }))
                    }
                  >
                    Remove Photo
                  </Button>
                ) : null}
              </div>
              {form.photo ? (
                <Image
                  src={form.photo}
                  alt="Member preview"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-lg object-cover border"
                  unoptimized
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="social-linkedin">LinkedIn</Label>
              <Input
                id="social-linkedin"
                placeholder="https://linkedin.com/in/username"
                value={form.socialLinks.linkedin ?? ""}
                onChange={(e) => setSocial("linkedin", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social-github">GitHub</Label>
              <Input
                id="social-github"
                placeholder="https://github.com/username"
                value={form.socialLinks.github ?? ""}
                onChange={(e) => setSocial("github", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social-twitter">Twitter/X</Label>
              <Input
                id="social-twitter"
                placeholder="https://x.com/username"
                value={form.socialLinks.twitter ?? ""}
                onChange={(e) => setSocial("twitter", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social-instagram">Instagram</Label>
              <Input
                id="social-instagram"
                placeholder="https://instagram.com/username"
                value={form.socialLinks.instagram ?? ""}
                onChange={(e) => setSocial("instagram", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social-email">Email</Label>
              <Input
                id="social-email"
                type="email"
                placeholder="name@example.com"
                value={form.socialLinks.email ?? ""}
                onChange={(e) => setSocial("email", e.target.value)}
              />
            </div>

            <div className="space-y-2 flex items-center justify-between rounded-md border px-3 py-2 mt-7">
              <Label htmlFor="member-active">Member is active</Label>
              <Switch
                id="member-active"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving
                ? editingMemberId
                  ? "Saving..."
                  : "Creating..."
                : editingMemberId
                  ? "Save Changes"
                  : "Create Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {memberToDelete?.name} will be
              removed from the committee list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (memberToDelete) {
                  void handleDelete(memberToDelete);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6 border-t pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Faculty</h2>
            <p className="text-muted-foreground">
              Add and manage faculty members shown on the public teams page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchFaculty}>
              Refresh
            </Button>
            <Button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                openFacultyCreateModal();
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Faculty
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Social Links</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-30 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFacultyLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading faculty members...
                  </TableCell>
                </TableRow>
              ) : facultyMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No faculty members found.
                  </TableCell>
                </TableRow>
              ) : (
                facultyMembers.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {faculty.photo ? (
                          <Image
                            src={faculty.photo}
                            alt={faculty.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full border object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full border bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {getInitials(faculty.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{faculty.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {faculty.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{faculty.designation}</TableCell>
                    <TableCell>{faculty.department}</TableCell>
                    <TableCell>{faculty.order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {faculty.socialLinks.linkedin ? (
                          <Linkedin className="h-4 w-4" />
                        ) : null}
                        {faculty.socialLinks.github ? (
                          <Github className="h-4 w-4" />
                        ) : null}
                        {faculty.socialLinks.twitter ? (
                          <Twitter className="h-4 w-4" />
                        ) : null}
                        {faculty.socialLinks.instagram ? (
                          <Instagram className="h-4 w-4" />
                        ) : null}
                        {faculty.socialLinks.email ? (
                          <Mail className="h-4 w-4" />
                        ) : null}
                        {Object.values(faculty.socialLinks).filter(Boolean)
                          .length === 0 ? (
                          <span className="text-xs">-</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={faculty.isActive}
                          onCheckedChange={() => handleFacultyToggle(faculty)}
                        />
                        <Badge
                          variant={faculty.isActive ? "success" : "secondary"}
                        >
                          {faculty.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openFacultyEditModal(faculty)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setFacultyToDelete(faculty)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isFacultyFormOpen} onOpenChange={setIsFacultyFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFacultyId ? "Edit Faculty" : "Add Faculty"}
            </DialogTitle>
            <DialogDescription>
              Update faculty details and social links for the public teams page.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="faculty-name">Name</Label>
              <Input
                id="faculty-name"
                value={facultyForm.name}
                onChange={(e) =>
                  setFacultyForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty-designation">Designation</Label>
              <Input
                id="faculty-designation"
                value={facultyForm.designation}
                onChange={(e) =>
                  setFacultyForm((prev) => ({
                    ...prev,
                    designation: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty-department">Department</Label>
              <Input
                id="faculty-department"
                value={facultyForm.department}
                onChange={(e) =>
                  setFacultyForm((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty-order">Display Order</Label>
              <Input
                id="faculty-order"
                type="number"
                min={0}
                value={facultyForm.order}
                onChange={(e) =>
                  setFacultyForm((prev) => ({
                    ...prev,
                    order: Number(e.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Photo</Label>
              <div className="flex flex-wrap items-center gap-3">
                <CloudinaryUpload
                  label={facultyForm.photo ? "Replace Photo" : "Upload Photo"}
                  folder="faculty"
                  onUpload={(url) =>
                    setFacultyForm((prev) => ({
                      ...prev,
                      photo: url,
                    }))
                  }
                  onUploadInfo={({ publicId }) =>
                    setFacultyForm((prev) => ({
                      ...prev,
                      cloudinaryId: publicId ?? prev.cloudinaryId,
                    }))
                  }
                />
                {facultyForm.photo ? (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFacultyForm((prev) => ({
                        ...prev,
                        photo: "",
                        cloudinaryId: "",
                      }))
                    }
                  >
                    Remove Photo
                  </Button>
                ) : null}
              </div>
              {facultyForm.photo ? (
                <Image
                  src={facultyForm.photo}
                  alt="Faculty preview"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-lg border object-cover"
                  unoptimized
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty-linkedin">LinkedIn</Label>
              <Input
                id="faculty-linkedin"
                placeholder="https://linkedin.com/in/username"
                value={facultyForm.socialLinks.linkedin ?? ""}
                onChange={(e) => setFacultySocial("linkedin", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty-github">GitHub</Label>
              <Input
                id="faculty-github"
                placeholder="https://github.com/username"
                value={facultyForm.socialLinks.github ?? ""}
                onChange={(e) => setFacultySocial("github", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty-twitter">Twitter/X</Label>
              <Input
                id="faculty-twitter"
                placeholder="https://x.com/username"
                value={facultyForm.socialLinks.twitter ?? ""}
                onChange={(e) => setFacultySocial("twitter", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty-instagram">Instagram</Label>
              <Input
                id="faculty-instagram"
                placeholder="https://instagram.com/username"
                value={facultyForm.socialLinks.instagram ?? ""}
                onChange={(e) => setFacultySocial("instagram", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty-email">Email</Label>
              <Input
                id="faculty-email"
                type="email"
                placeholder="name@example.com"
                value={facultyForm.socialLinks.email ?? ""}
                onChange={(e) => setFacultySocial("email", e.target.value)}
              />
            </div>

            <div className="mt-7 flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="faculty-active">Faculty is active</Label>
              <Switch
                id="faculty-active"
                checked={facultyForm.isActive}
                onCheckedChange={(checked) =>
                  setFacultyForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFacultyFormOpen(false)}
              disabled={isFacultySaving}
            >
              Cancel
            </Button>
            <Button onClick={handleFacultySubmit} disabled={isFacultySaving}>
              {isFacultySaving
                ? editingFacultyId
                  ? "Saving..."
                  : "Creating..."
                : editingFacultyId
                  ? "Save Changes"
                  : "Create Faculty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!facultyToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setFacultyToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete faculty member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {facultyToDelete?.name} will be
              removed from the faculty list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (facultyToDelete) {
                  void handleFacultyDelete(facultyToDelete);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
