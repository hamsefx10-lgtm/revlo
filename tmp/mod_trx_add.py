import os

file_path = r'c:\Users\OMEN\projects\revlo-vr\app\projects\accounting\transactions\add\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Background glow
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

# Header
old_header = """      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/projects/accounting/transactions" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Diiwaan Geli Dhaqdhaqaaq Cusub
        </h1>
      </div>"""
new_header = """      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 lg:mb-10 gap-6">
        <div>
           <Link href="/projects/accounting/transactions" className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mb-3">
            <ArrowLeft size={16} className="mr-2" /> Ku Noqo Liiska
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Diiwaangeli Dhaqdhaqaaq
          </h1>
        </div>
      </div>"""
content = content.replace(old_header, new_header)

# Form Wrapper
content = content.replace(
    'className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up"',
    'className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] shadow-xl border border-white/50 dark:border-gray-700/50 animate-fade-in-up"'
)

# Common inputs:
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

# Text red error
content = content.replace('text-redError', 'text-rose-500')
content = content.replace('border-redError', 'border-rose-500 ring-1 ring-rose-500')

# Submit button
content = content.replace(
    'className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"',
    'className="w-full bg-gradient-to-r from-blue-600 to-primary text-white py-4 px-6 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center"'
)

# Panels
content = content.replace('bg-redError/5', 'bg-rose-500/5')
content = content.replace('border-redError/20', 'border-rose-500/20')

content = content.replace(
    '</form >\n      </div >',
    '</form>\n      </div>\n      </div>' # Closing the <div className="relative z-10">
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated add page')
