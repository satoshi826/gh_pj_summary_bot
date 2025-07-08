import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { SummarizeProjectWorkflow } from "../workflows/summarize_project.ts";

/**
 * Triggers determine when workflows are executed. A trigger file describes a
 * scenario in which a workflow should be run, such as a user clicking a link.
 * Learn more: https://api.slack.com/automation/triggers/link
 */
const createNewIssueShortcut: Trigger<
  typeof SummarizeProjectWorkflow.definition
> = {
  type: TriggerTypes.Shortcut,
  name: "Summarize GitHub Project",
  description: "Summarize GitHub Project",
  workflow: `#/workflows/${SummarizeProjectWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channel: {
      value: TriggerContextData.Shortcut.channel_id,
    },
  },
};

export default createNewIssueShortcut;
