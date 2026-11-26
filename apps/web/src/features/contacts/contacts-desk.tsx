import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Application } from "../../types/application";
import { buildContacts } from "./contacts-data";

export function ContactsDesk({
  jobs,
  onSelectApplication,
}: {
  jobs: Application[];
  onSelectApplication: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const contacts = useMemo(() => buildContacts(jobs), [jobs]);

  const statuses = useMemo(
    () => ["all", ...new Set(contacts.map((contact) => contact.status))],
    [contacts],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (status !== "all" && contact.status !== status) return false;
      if (!needle) return true;
      return (
        contact.name.toLowerCase().includes(needle) ||
        contact.company.toLowerCase().includes(needle) ||
        contact.role.toLowerCase().includes(needle) ||
        contact.applications.some((app) =>
          app.company.toLowerCase().includes(needle) ||
          app.role.toLowerCase().includes(needle),
        )
      );
    });
  }, [contacts, query, status]);

  return (
    <div className="flex flex-col gap-5">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>
            Recruiter &amp; Referrer Directory{" "}
            <Badge variant="secondary">{contacts.length}</Badge>
          </CardFrameTitle>
        </CardFrameHeader>
        <CardFramePanel className="flex flex-col gap-3 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              value={query}
              placeholder="Search contacts, companies, roles…"
              onChange={(event) => setQuery(event.target.value)}
              className="bg-background"
            />
            <Select
              selectedKey={status}
              onSelectionChange={(key) => {
                if (key === null) return;
                setStatus(String(key));
              }}
              className="w-full"
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((item) => (
                  <SelectItem key={item} id={item} textValue={item}>
                    {item === "all" ? "All statuses" : item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No contacts yet</EmptyTitle>
                <EmptyDescription>
                  Referral contacts saved on applications will appear here,
                  grouped by person across every pipeline entry.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {filtered.map((contact) => (
                <div
                  key={contact.key}
                  className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{contact.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {contact.role} · {contact.company}
                      </p>
                    </div>
                    <Badge variant="secondary">{contact.status}</Badge>
                  </div>
                  {contact.profileUrl && (
                    <a
                      href={contact.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      Profile link
                    </a>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {contact.applications.map((application) => (
                      <Button
                        key={application.id}
                        variant="outline"
                        size="xs"
                        onPress={() => onSelectApplication(application.id)}
                      >
                        {application.company}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {contact.applications.length} application
                    {contact.applications.length === 1 ? "" : "s"}
                    {contact.lastFollowUp ? ` · last follow-up ${contact.lastFollowUp}` : ""}
                    {contact.messageCount ? ` · ${contact.messageCount} drafted message${contact.messageCount === 1 ? "" : "s"}` : ""}
                  </p>
                  {contact.outcomes.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Outcomes: {contact.outcomes.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardFramePanel>
      </CardFrame>
    </div>
  );
}
