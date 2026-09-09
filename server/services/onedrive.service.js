const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');

let graphClient = null;

const getClient = () => {
  if (graphClient) return graphClient;
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID,
    process.env.AZURE_CLIENT_ID,
    process.env.AZURE_CLIENT_SECRET,
  );
  graphClient = Client.initWithMiddleware({
    authProvider: { getAccessToken: () => credential.getToken('https://graph.microsoft.com/.default').then(t => t.token) },
  });
  return graphClient;
};

const appendRow = async (sheetName, rowData) => {
  const client = getClient();
  const fileId = process.env.ONEDRIVE_FILE_ID;
  await client.api(`/me/drive/items/${fileId}/workbook/worksheets('${sheetName}')/tables/1/rows`).post({ values: [rowData] });
};

const syncAllUsers = async (users) => {
  // Full reconciliation: compare DB users with Excel rows, update differences
  // Implementation depends on actual Excel structure
  console.log(`[OneDrive Sync] Syncing ${users.length} users`);
};

module.exports = { appendRow, syncAllUsers };
