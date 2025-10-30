
{
  pkgs, ...
}: {
  # The channel to use for picking packages
  channel = "stable-24.05"; # or "unstable"

  # A list of packages to install
  packages = [pkgs.nodejs_20];

  # A list of extensions to install
  idx.extensions = ["vscodevim.vim", "dbaeumer.vscode-eslint"];

  # Workspace lifecycle hooks
  idx.workspace = {
    # Runs when a workspace is first created
    onCreate = {
      npm-install = "npm install";
    };
    # Runs every time the workspace is (re)started
    onStart = {
      dev-server = "npm run dev";
    };
  };

  # Web preview configuration
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm", "run", "dev", "--", "--port", "$PORT"];
        manager = "web";
      };
    };
  };
}
