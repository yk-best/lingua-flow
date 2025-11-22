// src/utils/sync.ts

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  gistId?: string;
}

export async function saveToGist(token: string, data: any, existingGistId?: string): Promise<SyncResult> {
  const url = existingGistId 
    ? `https://api.github.com/gists/${existingGistId}`
    : `https://api.github.com/gists`;

  const method = existingGistId ? 'PATCH' : 'POST';
  
  const body = {
    description: "LinguaFlow Vocabulary Data",
    public: false,
    files: {
      "lingua-flow-data.json": {
        content: JSON.stringify(data, null, 2)
      }
    }
  };

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    const json = await response.json();
    return { success: true, message: "Saved successfully!", gistId: json.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function loadFromGist(token: string, gistId: string): Promise<SyncResult> {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load Gist");
    }

    const json = await response.json();
    const file = json.files["lingua-flow-data.json"];

    if (!file || !file.content) {
      throw new Error("Invalid Gist format: 'lingua-flow-data.json' not found.");
    }

    const data = JSON.parse(file.content);
    return { success: true, message: "Data loaded!", data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}