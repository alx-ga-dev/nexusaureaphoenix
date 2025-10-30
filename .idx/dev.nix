
{
  pkgs, ...
}: {
  # The channel to use for picking packages
  channel = "stable-24.05"; # or "unstable"

  # A list of packages to install
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
  ];

  # A list of extensions to install
  idx.extensions = [
    # "vscodevim.vim"
    "bradlc.vscode-tailwindcss"
    "dbaeumer.vscode-eslint"
    "google.gemini-cli-vscode-ide-companion"
    "csstools.postcss"
  ];

  # Workspace lifecycle hooks
  idx.workspace = {
    # Runs when a workspace is first created
    onCreate = {
      default.openFiles = [
        "src/app/page.tsx"
      ];
    };
  };

  # Web preview configuration
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
        manager = "web";
      };
    };
  };
}
