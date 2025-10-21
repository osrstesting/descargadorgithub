#!/usr/bin/env python3
import requests
import zipfile
import io
import os
import sys
from github import Github

def main():
    if len(sys.argv) != 2:
        print("Usage: python download_repos.py <github_username>")
        sys.exit(1)
        
    username = sys.argv[1]
    print(f"Downloading repositories for user: {username}")
    
    # Usar token de GitHub (automático en Actions)
    g = Github(os.getenv('GITHUB_TOKEN'))
    
    try:
        user = g.get_user(username)
        repos = user.get_repos()
        
        # Crear archivo ZIP
        zip_filename = f"{username}-repositories.zip"
        
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            repo_count = 0
            
            for repo in repos:
                if not repo.private:
                    print(f"Processing: {repo.name}")
                    
                    # Descargar el ZIP del repo
                    zip_url = f"https://github.com/{username}/{repo.name}/archive/refs/heads/{repo.default_branch}.zip"
                    
                    response = requests.get(zip_url)
                    if response.status_code == 200:
                        # Agregar el ZIP del repo al ZIP principal
                        zipf.writestr(f"{repo.name}.zip", response.content)
                        repo_count += 1
                    else:
                        print(f"Warning: Could not download {repo.name}")
        
        print(f"Successfully created {zip_filename} with {repo_count} repositories")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
