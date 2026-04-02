import os

files_to_fix = [
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\transactions\add\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\accounts\add\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\accounts\edit\[id]\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\transactions\edit\[id]\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\transactions\transfer\page.tsx'
]

buggy_string = """<Layout>
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-emerald-400/5 dark:bg-emerald-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="relative z-10">
        <div className="min-h-[400px]"""

fixed_string = """<Layout>
        <div className="min-h-[400px]"""

for fpath in files_to_fix:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if buggy_string in content:
            content = content.replace(buggy_string, fixed_string)
            with open(fpath, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Fixed {fpath}")
