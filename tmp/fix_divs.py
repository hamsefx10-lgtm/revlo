import os

files_to_fix = [
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\accounts\add\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\accounts\edit\[id]\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\transactions\edit\[id]\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\transactions\transfer\page.tsx'
]

for fpath in files_to_fix:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if we have an unclosed <div className="relative z-10"> without a matching </div> before </Layout>
        # A simple hack: just find '    </Layout>\n  );\n}' at the bottom and insert '      </div>\n' before it.
        if '      </div>\n    </Layout>\n  );\n}' not in content:
             content = content.replace('    </Layout>\n  );\n}', '      </div>\n    </Layout>\n  );\n}')
             with open(fpath, 'w', encoding='utf-8') as f:
                 f.write(content)
             print(f"Fixed {fpath}")
