import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

const query = `
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      projectsV2(first: 10) {
        nodes {
          id
          title
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
          items(first: 50) {
            nodes {
              id
              fieldValues(first: 8) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2SingleSelectField {
                        name
                      }
                    }
                  }
                }
              }
              content {
                ... on Issue {
                  number
                  title
                  url
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const SummarizeProjectDefinition = DefineFunction({
  callback_id: "summarize_project",
  title: "Summarize GitHub Project",
  description: "Summarize GitHub Project",
  source_file: "functions/summarize_project.ts",
  input_parameters: {
    properties: {
      githubAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "github",
      },
    },
    required: [
      "githubAccessTokenId",
    ],
  },
  output_parameters: {
    properties: {
      summary: {
        type: Schema.types.string,
        description: "Project summary",
      },
      // totalIssues: {
      //   type: Schema.types.number,
      //   description: "Total number of issues",
      // },
      // openIssues: {
      //   type: Schema.types.number,
      //   description: "Number of open issues",
      // },
      // closedIssues: {
      //   type: Schema.types.number,
      //   description: "Number of closed issues",
      // },
    },
    required: ["summary"],
  },
});

export default SlackFunction(
  SummarizeProjectDefinition,
  async ({ inputs, client }) => {
    const token = await client.apps.auth.external.get({
      external_token_id: inputs.githubAccessTokenId,
    });

    if (!token.ok) throw new Error("Failed to access auth token");

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.external_token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    try {
      const variables = {
        owner: Deno.env.get("REPO_OWNER"),
        repo: Deno.env.get("REPO_NAME"),
      };

      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      type Issue = {
        number: number;
        title: string;
        url: string;
      };

      type FieldValue = {
        name: string;
        field: {
          name: string;
        };
      };

      type ProjectItem = {
        id: string;
        fieldValues: {
          nodes: FieldValue[];
        };
        content: Issue | null;
      };

      const { data } = await response.json();
      const projects = data.repository.projectsV2.nodes as {
        id: string;
        title: string;
        fields: {
          nodes: {
            id: string;
            name: string;
            options?: {
              id: string;
              name: string;
            }[];
          }[];
        };
        items: {
          nodes: ProjectItem[];
        };
      }[];

      console.log("Projects:", projects);

      const targetProject = projects.find((p) =>
        p.title === Deno.env.get("PROJECT_NAME")
      );

      const statusFieldName = "Status";

      const issues = targetProject?.items.nodes
        .map((item) => {
          if (item.content === null) return null;

          // ステータス値を見つける
          const statusValue = item.fieldValues.nodes.find(
            (fieldValue) => fieldValue.field?.name === statusFieldName,
          );

          return {
            ...item.content,
            status: statusValue?.name || "未設定",
          };
        })
        .filter((item): item is Issue & { status: string } => item !== null);

      return {
        outputs: {
          summary: summarizeIssues(issues || []),
        },
      };
    } catch (err) {
      console.error(err);
      return {
        error: `プロジェクト要約の取得中にエラーが発生しました: \`${
          err instanceof Error ? err.message : String(err)
        }\``,
      };
    }
  },
);

function summarizeIssues(
  issues: { number: number; title: string; status: string }[],
): string {
  if (issues.length === 0) {
    return "このプロジェクトには現在、Issue が登録されていません。";
  }

  const total = issues.length;

  const issuesByStatus = issues.reduce((acc, issue) => {
    if (!acc[issue.status]) {
      acc[issue.status] = [];
    }
    acc[issue.status].push(issue);
    return acc;
  }, {} as Record<string, typeof issues>);

  let summary =
    `プロジェクトには合計 ${total} 件の Issue が登録されています。\n\n`;

  for (const [status, statusIssues] of Object.entries(issuesByStatus)) {
    summary += `【${status}】(${statusIssues.length}件)\n`;

    const maxDisplayPerStatus = 8;
    const displayed = statusIssues.slice(0, maxDisplayPerStatus);
    const remaining = statusIssues.length - displayed.length;

    summary += displayed.map((issue) => `#${issue.number}「${issue.title}」`)
      .join("\n");

    if (remaining > 0) summary += `\n他 ${remaining} 件の Issue があります。`;
    summary += "\n\n";
  }

  return summary;
}
