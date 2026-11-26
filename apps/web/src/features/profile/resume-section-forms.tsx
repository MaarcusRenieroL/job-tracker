import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  basicsSectionSchema,
  certificationsSectionSchema,
  educationSectionSchema,
  experienceSectionSchema,
  projectsSectionSchema,
  skillsSectionSchema,
  summarySectionSchema,
  type BasicsSection,
  type CertificationsSection,
  type EducationSection,
  type ExperienceSection,
  type ProjectsSection,
  type SkillsSection,
  type SummarySection,
} from "./resume-sections";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

function SectionSaveButton({
  saving,
  saved,
  disabled = false,
  label = "Save section",
}: {
  saving: boolean;
  saved: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button type="submit" size="xs" isDisabled={saving || disabled}>
      {saving ? (
        "Saving…"
      ) : saved ? (
        <>
          <Check className="size-3" /> Saved
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export function BasicsSectionForm({
  defaultValues,
  onSave,
}: {
  defaultValues: BasicsSection;
  onSave: (data: BasicsSection) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<BasicsSection>({
    resolver: zodResolver(basicsSectionSchema),
    mode: "onTouched",
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submit = handleSubmit(async (data) => {
    setSaved(false);
    await onSave(data);
    setSaved(true);
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Profile &amp; Contact Information</CardFrameTitle>
          <SectionSaveButton saving={isSubmitting} saved={saved} disabled={!isValid || !isDirty} />
        </CardFrameHeader>
        <CardFramePanel className="grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="basics-name" className="text-xs font-medium">
              Full name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="basics-name"
              aria-invalid={!!errors.name}
              {...register("name")}
              className="bg-background"
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="basics-headline" className="text-xs font-medium">
              Headline / target title
            </Label>
            <Input
              id="basics-headline"
              placeholder="e.g. Senior Backend Engineer"
              aria-invalid={!!errors.headline}
              {...register("headline")}
              className="bg-background"
            />
            <FieldError message={errors.headline?.message} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="basics-email" className="text-xs font-medium">
              Email
            </Label>
            <Input
              id="basics-email"
              type="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
              className="bg-background"
            />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="basics-phone" className="text-xs font-medium">
              Phone
            </Label>
            <Input
              id="basics-phone"
              placeholder="+1 (555) 123-4567"
              {...register("phone")}
              className="bg-background"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="basics-location" className="text-xs font-medium">
              Location
            </Label>
            <Input
              id="basics-location"
              placeholder="e.g. Bengaluru, India"
              {...register("location")}
              className="bg-background"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="basics-links" className="text-xs font-medium">
              Links (LinkedIn, GitHub, Portfolio)
            </Label>
            <Input
              id="basics-links"
              placeholder="https://github.com/..., https://linkedin.com/in/..."
              {...register("links")}
              className="bg-background"
            />
          </div>
        </CardFramePanel>
      </CardFrame>
    </form>
  );
}

export function SummarySectionForm({
  defaultValues,
  onSave,
}: {
  defaultValues: SummarySection;
  onSave: (data: SummarySection) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<SummarySection>({
    resolver: zodResolver(summarySectionSchema),
    mode: "onTouched",
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submit = handleSubmit(async (data) => {
    setSaved(false);
    await onSave(data);
    setSaved(true);
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Professional Summary</CardFrameTitle>
          <SectionSaveButton saving={isSubmitting} saved={saved} disabled={!isValid || !isDirty} />
        </CardFrameHeader>
        <CardFramePanel className="flex flex-col gap-1.5 p-4">
          <Label htmlFor="summary-text" className="text-xs font-medium">
            Summary / Objective
          </Label>
          <Textarea
            id="summary-text"
            placeholder="2–4 sentences highlighting your core strengths, domain focus, and measurable impact…"
            aria-invalid={!!errors.summary}
            {...register("summary")}
            className="min-h-24 bg-background"
          />
          <FieldError message={errors.summary?.message} />
        </CardFramePanel>
      </CardFrame>
    </form>
  );
}

export function SkillsSectionForm({
  defaultValues,
  onSave,
}: {
  defaultValues: SkillsSection;
  onSave: (data: SkillsSection) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<SkillsSection>({
    resolver: zodResolver(skillsSectionSchema),
    mode: "onTouched",
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submit = handleSubmit(async (data) => {
    setSaved(false);
    await onSave(data);
    setSaved(true);
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Skills &amp; Technologies</CardFrameTitle>
          <SectionSaveButton saving={isSubmitting} saved={saved} disabled={!isValid || !isDirty} />
        </CardFrameHeader>
        <CardFramePanel className="flex flex-col gap-1.5 p-4">
          <Label htmlFor="skills-text" className="text-xs font-medium">
            Skills (comma-separated or grouped)
          </Label>
          <Textarea
            id="skills-text"
            placeholder="TypeScript, React, Node.js, PostgreSQL, Docker, Kubernetes, AWS…"
            aria-invalid={!!errors.skills}
            {...register("skills")}
            className="min-h-20 bg-background"
          />
          <FieldError message={errors.skills?.message} />
        </CardFramePanel>
      </CardFrame>
    </form>
  );
}

export function ExperienceSectionForm({
  defaultValues,
  onSave,
}: {
  defaultValues: ExperienceSection;
  onSave: (data: ExperienceSection) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<ExperienceSection>({
    resolver: zodResolver(experienceSectionSchema),
    mode: "onTouched",
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submit = handleSubmit(async (data) => {
    setSaved(false);
    await onSave(data);
    setSaved(true);
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>
            Work Experience
            <Badge variant="secondary" className="h-4 px-1.5 text-xs tabular-nums">
              {fields.length}
            </Badge>
          </CardFrameTitle>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onPress={() =>
                append({
                  company: "",
                  role: "",
                  duration: "",
                  location: "",
                  highlights: "",
                })
              }
            >
              <Plus className="size-3" /> Add role
            </Button>
            <SectionSaveButton saving={isSubmitting} saved={saved} disabled={!isValid || !isDirty} />
          </div>
        </CardFrameHeader>
        <CardFramePanel className="flex flex-col gap-3.5 p-4">
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No work experience entries yet. Add a role or upload a PDF resume
              above to auto-populate this section.
            </p>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/25 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Role {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove role ${index + 1}`}
                    onPress={() => remove(index)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`exp-role-${index}`}
                      className="text-xs font-medium"
                    >
                      Job title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`exp-role-${index}`}
                      aria-invalid={!!errors.items?.[index]?.role}
                      {...register(`items.${index}.role`)}
                      className="bg-background"
                    />
                    <FieldError message={errors.items?.[index]?.role?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`exp-company-${index}`}
                      className="text-xs font-medium"
                    >
                      Company <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`exp-company-${index}`}
                      aria-invalid={!!errors.items?.[index]?.company}
                      {...register(`items.${index}.company`)}
                      className="bg-background"
                    />
                    <FieldError
                      message={errors.items?.[index]?.company?.message}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`exp-duration-${index}`}
                      className="text-xs font-medium"
                    >
                      Dates
                    </Label>
                    <Input
                      id={`exp-duration-${index}`}
                      placeholder="e.g. Jan 2023 – Present"
                      {...register(`items.${index}.duration`)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`exp-location-${index}`}
                      className="text-xs font-medium"
                    >
                      Location
                    </Label>
                    <Input
                      id={`exp-location-${index}`}
                      placeholder="e.g. Remote / Bengaluru"
                      {...register(`items.${index}.location`)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label
                      htmlFor={`exp-highlights-${index}`}
                      className="text-xs font-medium"
                    >
                      Key achievements &amp; impact (one bullet per line)
                    </Label>
                    <Textarea
                      id={`exp-highlights-${index}`}
                      {...register(`items.${index}.highlights`)}
                      className="min-h-24 bg-background"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardFramePanel>
      </CardFrame>
    </form>
  );
}

export function ProjectsSectionForm({
  defaultValues,
  onSave,
}: {
  defaultValues: ProjectsSection;
  onSave: (data: ProjectsSection) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<ProjectsSection>({
    resolver: zodResolver(projectsSectionSchema),
    mode: "onTouched",
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submit = handleSubmit(async (data) => {
    setSaved(false);
    await onSave(data);
    setSaved(true);
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>
            Projects
            <Badge variant="secondary" className="h-4 px-1.5 text-xs tabular-nums">
              {fields.length}
            </Badge>
          </CardFrameTitle>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onPress={() =>
                append({ name: "", techStack: "", link: "", description: "" })
              }
            >
              <Plus className="size-3" /> Add project
            </Button>
            <SectionSaveButton saving={isSubmitting} saved={saved} disabled={!isValid || !isDirty} />
          </div>
        </CardFrameHeader>
        <CardFramePanel className="flex flex-col gap-3.5 p-4">
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No projects listed yet. Add a project to highlight architecture or
              open-source work.
            </p>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/25 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Project {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove project ${index + 1}`}
                    onPress={() => remove(index)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`proj-name-${index}`}
                      className="text-xs font-medium"
                    >
                      Project name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`proj-name-${index}`}
                      aria-invalid={!!errors.items?.[index]?.name}
                      {...register(`items.${index}.name`)}
                      className="bg-background"
                    />
                    <FieldError message={errors.items?.[index]?.name?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`proj-tech-${index}`}
                      className="text-xs font-medium"
                    >
                      Tech stack
                    </Label>
                    <Input
                      id={`proj-tech-${index}`}
                      placeholder="TypeScript, Hono, MongoDB…"
                      {...register(`items.${index}.techStack`)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label
                      htmlFor={`proj-link-${index}`}
                      className="text-xs font-medium"
                    >
                      Repository / live URL
                    </Label>
                    <Input
                      id={`proj-link-${index}`}
                      type="url"
                      placeholder="https://github.com/..."
                      aria-invalid={!!errors.items?.[index]?.link}
                      {...register(`items.${index}.link`)}
                      className="bg-background"
                    />
                    <FieldError message={errors.items?.[index]?.link?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label
                      htmlFor={`proj-desc-${index}`}
                      className="text-xs font-medium"
                    >
                      Description &amp; outcomes
                    </Label>
                    <Textarea
                      id={`proj-desc-${index}`}
                      {...register(`items.${index}.description`)}
                      className="min-h-20 bg-background"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardFramePanel>
      </CardFrame>
    </form>
  );
}

export function EducationSectionForm({
  defaultValues,
  onSave,
}: {
  defaultValues: EducationSection;
  onSave: (data: EducationSection) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<EducationSection>({
    resolver: zodResolver(educationSectionSchema),
    mode: "onTouched",
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submit = handleSubmit(async (data) => {
    setSaved(false);
    await onSave(data);
    setSaved(true);
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>
            Education
            <Badge variant="secondary" className="h-4 px-1.5 text-xs tabular-nums">
              {fields.length}
            </Badge>
          </CardFrameTitle>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onPress={() =>
                append({ institution: "", degree: "", duration: "", details: "" })
              }
            >
              <Plus className="size-3" /> Add education
            </Button>
            <SectionSaveButton saving={isSubmitting} saved={saved} disabled={!isValid || !isDirty} />
          </div>
        </CardFrameHeader>
        <CardFramePanel className="flex flex-col gap-3.5 p-4">
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No education entries added yet.
            </p>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/25 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Education {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove education ${index + 1}`}
                    onPress={() => remove(index)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`edu-degree-${index}`}
                      className="text-xs font-medium"
                    >
                      Degree / program <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`edu-degree-${index}`}
                      aria-invalid={!!errors.items?.[index]?.degree}
                      {...register(`items.${index}.degree`)}
                      className="bg-background"
                    />
                    <FieldError
                      message={errors.items?.[index]?.degree?.message}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`edu-school-${index}`}
                      className="text-xs font-medium"
                    >
                      Institution <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`edu-school-${index}`}
                      aria-invalid={!!errors.items?.[index]?.institution}
                      {...register(`items.${index}.institution`)}
                      className="bg-background"
                    />
                    <FieldError
                      message={errors.items?.[index]?.institution?.message}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`edu-duration-${index}`}
                      className="text-xs font-medium"
                    >
                      Dates
                    </Label>
                    <Input
                      id={`edu-duration-${index}`}
                      placeholder="e.g. 2019 – 2023"
                      {...register(`items.${index}.duration`)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`edu-details-${index}`}
                      className="text-xs font-medium"
                    >
                      GPA / honors / coursework
                    </Label>
                    <Input
                      id={`edu-details-${index}`}
                      {...register(`items.${index}.details`)}
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardFramePanel>
      </CardFrame>
    </form>
  );
}

export function CertificationsSectionForm({
  defaultValues,
  onSave,
}: {
  defaultValues: CertificationsSection;
  onSave: (data: CertificationsSection) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<CertificationsSection>({
    resolver: zodResolver(certificationsSectionSchema),
    mode: "onTouched",
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submit = handleSubmit(async (data) => {
    setSaved(false);
    await onSave(data);
    setSaved(true);
  });

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>
            Certifications &amp; Awards
            <Badge variant="secondary" className="h-4 px-1.5 text-xs tabular-nums">
              {fields.length}
            </Badge>
          </CardFrameTitle>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onPress={() => append({ title: "", issuer: "", year: "" })}
            >
              <Plus className="size-3" /> Add item
            </Button>
            <SectionSaveButton saving={isSubmitting} saved={saved} disabled={!isValid || !isDirty} />
          </div>
        </CardFrameHeader>
        <CardFramePanel className="flex flex-col gap-3 p-4">
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No certifications or awards added yet.
            </p>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/25 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Item {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove certification ${index + 1}`}
                    onPress={() => remove(index)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label
                      htmlFor={`cert-title-${index}`}
                      className="text-xs font-medium"
                    >
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`cert-title-${index}`}
                      aria-invalid={!!errors.items?.[index]?.title}
                      {...register(`items.${index}.title`)}
                      className="bg-background"
                    />
                    <FieldError
                      message={errors.items?.[index]?.title?.message}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`cert-year-${index}`}
                      className="text-xs font-medium"
                    >
                      Year
                    </Label>
                    <Input
                      id={`cert-year-${index}`}
                      placeholder="2025"
                      {...register(`items.${index}.year`)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-3">
                    <Label
                      htmlFor={`cert-issuer-${index}`}
                      className="text-xs font-medium"
                    >
                      Issuer / Organization
                    </Label>
                    <Input
                      id={`cert-issuer-${index}`}
                      placeholder="e.g. AWS, CNCF, Coursera"
                      {...register(`items.${index}.issuer`)}
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardFramePanel>
      </CardFrame>
    </form>
  );
}
