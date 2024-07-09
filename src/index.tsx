import {
  Action,
  ActionPanel,
  Clipboard,
  Form,
  LaunchProps,
  Toast,
  closeMainWindow,
  getPreferenceValues,
  open,
  popToRoot,
  showToast,
} from "@raycast/api";

import { execSync } from "child_process";

interface Preferences {
  chatId: string;
}

interface PRValues {
  prMessage: string;
}

const { chatId } = getPreferenceValues<Preferences>();

export default function Command({
  draftValues,
}: LaunchProps<{ draftValues: PRValues }>) {
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Send PR Message"
            onSubmit={sendPRToTeams}
          />
        </ActionPanel>
      }
      enableDrafts
    >
      <Form.TextArea
        id="prMessage"
        title="PR Message"
        defaultValue={draftValues?.prMessage}
        placeholder="Enter your PR message here..."
      />
    </Form>
  );
}

// URL to open the specified Teams chat
const teamsChatUrl = `https://teams.microsoft.com/l/chat/19:${chatId}@thread.v2/conversations`;

const sendCopyHotkey = () => {
  // Execute AppleScript to send Cmd + Shift + C keystroke instide Arc
  const script = `
      tell application "Arc" to activate
      delay 0.5
      tell application "System Events"
        keystroke "c" using {command down, shift down}
      end tell
    `;

  try {
    execSync(`osascript -e '${script}'`);
    showToast(Toast.Style.Success, "Sending hotkey...");
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to Send Hotkey",
      message: (error as Error).message,
    });
  }
};

const waitFor = async (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function sendPRToTeams({ prMessage }: { prMessage: string }) {
  try {
    sendCopyHotkey();

    // Wait for the clipboard to be updated
    await waitFor(100);

    // Read the text from the clipboard
    const clipboardText = await Clipboard.readText();

    if (!clipboardText) {
      showToast(Toast.Style.Failure, "Clipboard is empty");
      return;
    }

    // Open the Teams chat URL
    await open(teamsChatUrl, "com.microsoft.teams2");

    // Wait for the Teams chat to open
    await waitFor(500);

    const message = prMessage
      ? `${prMessage}\n\n${clipboardText}`
      : clipboardText;

    // Paste the clipboard content
    await Clipboard.paste(message);

    // Show success message
    showToast(Toast.Style.Success, "Send your PR to the team! 🚀");
  } catch (error) {
    showToast(Toast.Style.Failure, "Failed to open Teams chat");
  }

  await closeMainWindow({ clearRootSearch: true });
  await popToRoot({ clearSearchBar: true });
}
