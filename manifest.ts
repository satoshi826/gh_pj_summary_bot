import { Manifest } from "deno-slack-sdk/mod.ts";
// import SampleWorkflow from "./workflows/sample_workflow.ts";
import GitHubProvider from "./external_auth/github_provider.ts";
import CreateNewIssueWorkflow from "./workflows/create_new_issue.ts";

export default Manifest({
  name: "simple-message-bot",
  description: "入力されたメッセージをそのままチャンネルに送信するSlackアプリ",
  icon: "assets/default_new_app_icon.png",
  // workflows: [SampleWorkflow],
  // outgoingDomains: [],
  // datastores: [],
  externalAuthProviders: [GitHubProvider],
  workflows: [CreateNewIssueWorkflow],
  /**
   * Domains used in remote HTTP requests must be specified as outgoing domains.
   * If your organization uses a seperate GitHub Enterprise domain, add it here
   * to make API calls to it from a custom function.
   */
  outgoingDomains: ["api.github.com"],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
  ],
});
