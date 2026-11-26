import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function SkillGaps({ token }: { token: string }) {
  const [missing, setMissing] = useState<{ skill: string; count: number }[]>();
  const [missingError, setMissingError] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ skills: { skill: string; count: number }[] }>(
      "/applications/missing-skills",
      token,
    )
      .then(({ skills }) => {
        if (active) setMissing(skills);
      })
      .catch(() => {
        if (active) setMissingError(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <CardFrame className="lg:col-span-4">
      <CardFrameHeader>
        <CardFrameTitle>Most Frequent Resume Skill Gaps</CardFrameTitle>
      </CardFrameHeader>
      <CardFramePanel className="divide-y divide-border/70">
        {missingError ? (
          <p className="p-4 text-xs text-muted-foreground">
            Could not load skill gaps.
          </p>
        ) : !missing ? (
          <p className="p-4 text-xs text-muted-foreground">
            Checking saved resumes…
          </p>
        ) : missing.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">
            No missing required skills across saved resumes.
          </p>
        ) : (
          missing.map(({ skill, count }) => (
            <div
              key={skill}
              className="flex items-center justify-between px-4 py-2.5 text-xs"
            >
              <span className="font-medium text-foreground">{skill}</span>
              <Badge variant="secondary" className="tabular-nums">
                {count} {count === 1 ? "role" : "roles"}
              </Badge>
            </div>
          ))
        )}
      </CardFramePanel>
    </CardFrame>
  );
}
