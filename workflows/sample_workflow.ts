import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SampleFunctionDefinition } from "../functions/sample_function.ts";

const SampleWorkflow = DefineWorkflow({
  callback_id: "sample_workflow",
  title: "シンプルメッセージ送信",
  description: "このチャンネルにメッセージをシンプルに送信するワークフロー",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
      user: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const inputForm = SampleWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "メッセージを送信",
    interactivity: SampleWorkflow.inputs.interactivity,
    submit_label: "送信する",
    fields: {
      elements: [{
        name: "message",
        title: "メッセージ内容",
        type: Schema.types.string,
        long: true,
      }],
      required: ["message"],
    },
  },
);

const sampleFunctionStep = SampleWorkflow.addStep(SampleFunctionDefinition, {
  message: inputForm.outputs.fields.message,
  user: SampleWorkflow.inputs.user,
});

SampleWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: SampleWorkflow.inputs.channel,
  message: sampleFunctionStep.outputs.updatedMsg,
});

export default SampleWorkflow;
