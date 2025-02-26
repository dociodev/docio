export default function Index() {
  return (
    <div class='bg-gray-900 h-screen'>
      <header class='absolute inset-x-0 top-0 z-50'>
        <nav
          class='flex items-center justify-between p-6 lg:px-8'
          aria-label='Global'
        >
          <div class='flex lg:flex-1'>
            <a href='#' class='-m-1.5 p-1.5'>
              <span class='sr-only'>docio.dev</span>
              <span class="text-xl font-bold text-indigo-500">docio.dev</span>
            </a>
          </div>
          <div class='flex lg:hidden'>
            <button
              type='button'
              class='-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400'
            >
              <span class='sr-only'>Open main menu</span>
              <svg
                class='size-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke-width='1.5'
                stroke='currentColor'
                aria-hidden='true'
                data-slot='icon'
              >
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                />
              </svg>
            </button>
          </div>
          <div class='hidden lg:flex lg:gap-x-12'>
            <a href='https://rspress.dev' target="_blank" rel="noopener" class='text-sm/6 font-semibold text-white'>Rspress</a>
            <a href='https://github.com/docio-dev' target="_blank" rel="noopener" class='text-sm/6 font-semibold text-white'>GitHub</a>
            <div class='rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-500 ring-1 ring-inset ring-yellow-500/20'>
              Work in Progress
            </div>
          </div>
        </nav>
        <div class='lg:hidden' role='dialog' aria-modal='true'>
          <div class='fixed inset-0 z-50'></div>
          <div class='fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10'>
            <div class='flex items-center justify-between'>
              <a href='#' class='-m-1.5 p-1.5'>
                <span class='sr-only'>docio.dev</span>
                <span class="text-xl font-bold text-indigo-500">docio.dev</span>
              </a>
              <button
                type='button'
                class='-m-2.5 rounded-md p-2.5 text-gray-400'
              >
                <span class='sr-only'>Close menu</span>
                <svg
                  class='size-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke-width='1.5'
                  stroke='currentColor'
                  aria-hidden='true'
                  data-slot='icon'
                >
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    d='M6 18 18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <div class='mt-6 flow-root'>
              <div class='-my-6 divide-y divide-gray-500/25'>
                <div class='space-y-2 py-6'>
                  <div class='rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-500 ring-1 ring-inset ring-yellow-500/20 inline-block mb-4'>
                    Work in Progress
                  </div>
                  <a
                    href='https://rspress.dev'
                    target="_blank"
                    rel="noopener"
                    class='-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-gray-800'
                  >
                    Rspress
                  </a>
                  <a
                    href='https://github.com/docio-dev'
                    target="_blank"
                    rel="noopener"
                    class='-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-gray-800'
                  >
                    GitHub
                  </a>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class='relative isolate pt-14'>
        <div
          class='absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80'
          aria-hidden='true'
        >
          <div
            class='relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]'
            style='clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
          >
          </div>
        </div>
        <div class='py-24 sm:py-32 lg:pb-40'>
          <div class='mx-auto max-w-7xl px-6 lg:px-8'>
            <div class='mx-auto max-w-2xl text-center'>
              <h1 class='text-balance text-5xl font-semibold tracking-tight text-white sm:text-7xl'>
                Documentation Hub for Rspress
              </h1>
              <p class='mt-8 text-pretty text-lg font-medium text-gray-400 sm:text-xl/8'>
                🚧 Under Active Development 🚧
              </p>
              <p class='mt-4 text-pretty text-lg font-medium text-gray-400 sm:text-xl/8'>
                docio.dev will be a dedicated platform for hosting and managing comprehensive documentation for Rspress - the Modern SSG Framework for React. Stay tuned for updates!
              </p>
              <div class='mt-10 flex items-center justify-center gap-x-6'>
                <a
                  href='https://rspress.dev'
                  target="_blank"
                  rel="noopener"
                  class='rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400'
                >
                  View Rspress
                </a>
                <a
                  href='https://github.com/docio-dev'
                  target="_blank"
                  rel="noopener"
                  class='rounded-md bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-white/20'
                >
                  Follow Development
                </a>
              </div>
            </div>
            
          </div>
        </div>
        <div
          class='absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]'
          aria-hidden='true'
        >
          <div
            class='relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]'
            style='clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
          >
          </div>
        </div>
      </div>
    </div>
  )
}
