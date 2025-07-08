import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SummarizeProjectDefinition } from "../functions/summarize_project.ts";

export const SummarizeProjectWorkflow = DefineWorkflow({
  callback_id: "summarize_project_workflow",
  title: "GitHubプロジェクト要約",
  description: "GitHubプロジェクトの情報を要約します",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
    },
    required: ["interactivity", "channel"],
  },
});

// const issueFormData = SummarizeProjectWorkflow.addStep(
//   Schema.slack.functions.OpenForm,
//   {
//     title: "GitHubプロジェクト要約",
//     interactivity: SummarizeProjectWorkflow.inputs.interactivity,
//     submit_label: "要約を生成",
//     description: "GitHubプロジェクトの情報を要約します",
//     fields: {
//       elements: [
//         {
//           name: "url",
//           title: "GitHub URL",
//           type: Schema.types.string,
//           description:
//             "GitHub リポジトリのURLを入力してください (例: https://github.com/owner/repo/issues)",
//         },
//       ],
//       required: ["url"],
//     },
//   },
// );

const projectSummary = SummarizeProjectWorkflow.addStep(
  SummarizeProjectDefinition,
  {
    githubAccessTokenId: {
      credential_source: "DEVELOPER",
    },
    // url: issueFormData.outputs.fields.url,
  },
);

SummarizeProjectWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: SummarizeProjectWorkflow.inputs.channel,
  message: projectSummary.outputs.summary,
});
