import {
  agendaQuery,
  applicationListQuery,
  applicationSchema,
  assessmentSchema,
  clearableApplicationKeys,
  formattedApplicationFields,
  interviewResults,
  interviewSchema,
  interviewTypes,
  offerSchema,
  prioritySchema,
  referralSchema,
  referralStatuses,
  stages,
  stageSchema,
  tagSchema,
  tagsSchema,
  updateSchema,
  workModels,
  workModelSchema,
  type ApplicationInput,
  type Stage,
  type StageTransition,
} from "@job-tracker/application-options";

export {
  agendaQuery,
  applicationListQuery,
  applicationSchema,
  assessmentSchema,
  clearableApplicationKeys,
  formattedApplicationFields,
  interviewResults,
  interviewSchema,
  interviewTypes,
  offerSchema,
  prioritySchema,
  referralSchema,
  referralStatuses,
  stages,
  stageSchema,
  tagSchema,
  tagsSchema,
  updateSchema,
  workModels,
  workModelSchema,
  type ApplicationInput,
  type Stage,
};

export type Application = Omit<ApplicationInput, "stage"> & {
  ownerId: string;
  stage: Stage;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  history: StageTransition<Date>[];
};
