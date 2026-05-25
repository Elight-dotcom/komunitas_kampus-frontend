import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, UsersRound } from "lucide-react";
import { useParams } from "react-router-dom";

import { membershipApi } from "@/api/membership/membership.api";
import { InviteMemberModal } from "@/components/membership";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getInitials(value?: string | null) {
  return (value || "MB")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function MemberListPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [search, setSearch] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const membersQuery = useQuery({
    queryKey: ["membership", "members", orgId],
    queryFn: () => membershipApi.getMembers(orgId!),
    enabled: Boolean(orgId),
  });

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return membersQuery.data ?? [];

    return (membersQuery.data ?? []).filter((member) => {
      return [member.fullName, member.username, member.email, member.organizationName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword));
    });
  }, [membersQuery.data, search]);

  if (!orgId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7fb] p-4">
        <Card>
          <CardContent className="p-6 text-sm text-neutral-600">
            Organization ID tidak ditemukan di route.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7fb] px-4 py-6">
      <section className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-950">Manajemen Anggota</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Lihat anggota aktif dan undang mahasiswa baru ke organisasi.
            </p>
          </div>
          <Button
            className="bg-indigo-800 hover:bg-indigo-900"
            onClick={() => setIsInviteOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Undang Anggota
          </Button>
        </div>

        <Card className="rounded-3xl border-neutral-200">
          <CardHeader>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, username, atau email..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {membersQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                  <UsersRound className="h-7 w-7 text-indigo-700" />
                </div>
                <h2 className="text-base font-bold text-neutral-950">Belum ada anggota</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Anggota aktif akan tampil di tabel ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avatar</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tanggal Bergabung</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Avatar>
                            <AvatarFallback>{getInitials(member.fullName ?? member.username)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-semibold">{member.fullName ?? "-"}</TableCell>
                        <TableCell>@{member.username ?? "-"}</TableCell>
                        <TableCell>{member.email ?? "-"}</TableCell>
                        <TableCell>{formatDate(member.resolvedAt ?? member.requestedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <InviteMemberModal orgId={orgId} open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </main>
  );
}
