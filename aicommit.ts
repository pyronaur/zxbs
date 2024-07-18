import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: Bun.env.ANTHROPIC_API_KEY,
});

async function getUncommittedChanges(): Promise<string> {
  return (await $`git diff --staged`.quiet().text()).trim();
}

async function generateCommitMessage(changes: string): Promise<string> {
  const message = await anthropic.messages.create({
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a concise and informative commit message based on the following Git diff:\n\n${changes}\n\nCommit message:`,
      },
    ],
    model: "claude-3-sonnet-20240229",
  });

  return message.content[0].text.trim();
}

async function commitChanges(message: string): Promise<void> {
  await $`git commit -m ${message}`.quiet();
  console.log(ansis.green("Changes committed successfully!"));
}

async function main() {
  const changes = await getUncommittedChanges();

  if (!changes) {
    console.log(ansis.yellow("No uncommitted changes found."));
    return;
  }

  let commitMessage = await generateCommitMessage(changes);
  let isCommitAccepted = false;

  while (!isCommitAccepted) {
    console.log(ansis.bold(`\nProposed commit message:\n${commitMessage}\n`));
    const userResponse = await ack("Do you like this commit message?", "n");

    if (userResponse) {
      isCommitAccepted = true;
    } else {
      const options = ["Regenerate", "Edit manually", "Cancel"];
      const choice = await select("What would you like to do?", options);

      switch (choice) {
        case "Regenerate":
          const suggestions = await prompt(
            "Please provide suggestions or feedback for improvement:"
          );
          commitMessage = await generateCommitMessage(
            `${changes}\n\nPrevious suggestion: ${commitMessage}\n\nUser feedback: ${suggestions}`
          );
          break;
        case "Edit manually":
          commitMessage = await prompt("Please enter your own commit message:");
          isCommitAccepted = true;
          break;
        case "Cancel":
          console.log(ansis.yellow("Commit cancelled."));
          return;
      }
    }
  }

  await commitChanges(commitMessage);
}

main().catch((error) => {
  console.error(ansis.red("An error occurred:"), error);
});
