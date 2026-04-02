import os

files_to_mod = [
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\accounts\add\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\accounts\edit\[id]\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\transactions\edit\[id]\page.tsx',
    r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\transactions\transfer\page.tsx'
]

for file_path in files_to_mod:
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, does not exist.")
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add Background glow
    if '{/* Background Glow Effects */}' not in content:
        content = content.replace(
            '<Layout>',
            """<Layout>
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-emerald-400/5 dark:bg-emerald-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="relative z-10">"""
        )

    # Standard Header -> Premium Header pattern matching
    # We find `<div className="flex justify-between items-center mb-8">`
    content = content.replace(
        '<div className="flex justify-between items-center mb-8">',
        '<div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 lg:mb-10 gap-6">'
    )
    
    # ArrowLeft link replacements
    content = content.replace(
        'className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4"',
        'className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mb-3"'
    )
    content = content.replace(
        '<ArrowLeft size={28} className="inline-block" />',
        '<ArrowLeft size={16} className="mr-2" /> Ku Noqo'
    )
    # H1 classes
    content = content.replace(
        'className="text-4xl font-bold text-darkGray dark:text-gray-100"',
        'className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight"'
    )

    # Form Wrapper
    content = content.replace(
        'className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up"',
        'className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] shadow-xl border border-white/50 dark:border-gray-700/50 animate-fade-in-up"'
    )
    
    # Mobile TransactionCard uses this sometimes
    content = content.replace(
        'className="bg-white dark:bg-gray-800 p-6 sm:p-8 md:p-10 rounded-xl shadow-xl animate-fade-in-up max-w-4xl mx-auto"',
        'className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] shadow-xl border border-white/50 dark:border-gray-700/50 animate-fade-in-up max-w-4xl mx-auto"'
    )

    # Common inputs
    content = content.replace(
        'border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200',
        'border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner'
    )
    content = content.replace(
        'border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200',
        'border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner'
    )
    content = content.replace(
        'border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary',
        'border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner'
    )

    # For text areas and other borders
    content = content.replace(
        'w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200',
        'w-full p-3 pl-10 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner'
    )

    # Text red error
    content = content.replace('text-redError', 'text-rose-500')
    content = content.replace('border-redError', 'border-rose-500 ring-1 ring-rose-500')

    # Submit buttons
    content = content.replace(
        'className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"',
        'className="w-full bg-gradient-to-r from-blue-600 to-primary text-white py-4 px-6 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center"'
    )
    content = content.replace(
        'className="w-full py-4 px-6 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-2 hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed bg-primary hover:bg-blue-700"',
        'className="w-full bg-gradient-to-r from-primary to-blue-600 border border-primary/20 text-white py-4 px-6 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center disabled:opacity-70 disabled:hover:translate-y-0"'
    )

    # Panels
    content = content.replace('bg-redError/5', 'bg-rose-500/5')
    content = content.replace('border-redError/20', 'border-rose-500/20')

    # Check warning boxes
    content = content.replace(
        'className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg flex items-start space-x-3 border border-yellow-200 dark:border-yellow-800"',
        'className="bg-orange-50/50 dark:bg-orange-900/10 backdrop-blur-md p-5 rounded-2xl flex items-start space-x-4 border border-orange-200/50 dark:border-orange-800/20"'
    )
    content = content.replace('text-yellow-600', 'text-orange-500')
    content = content.replace('text-yellow-800', 'text-orange-700')
    content = content.replace('dark:text-yellow-300', 'dark:text-orange-300')
    content = content.replace('dark:text-yellow-400', 'dark:text-orange-400')

    if '</form >\n      </div >' in content:
        content = content.replace('</form >\n      </div >', '</form>\n      </div>\n      </div>')
    elif '</form>\n      </div>\n      {toastMessage' in content:
        content = content.replace('</form>\n      </div>\n      {toastMessage', '</form>\n      </div>\n      </div>\n      {toastMessage')
    elif '</form>\n        </div>\n      </div>\n\n      {toastMessage' in content:
        content = content.replace('</form>\n        </div>\n      </div>\n\n      {toastMessage', '</form>\n        </div>\n      </div>\n      </div>\n\n      {toastMessage')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated {file_path}")
