<!-- Tailwind CSS CDN with Trough X Custom Theme -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
          poppins: ['Poppins', 'sans-serif'],
          mono: ['Inconsolata', 'monospace'],
          inconsolata: ['Inconsolata', 'monospace'],
        },
        colors: {
          trough: {
            yellow: '#FFCC00',
            yellowHover: '#E5B800',
            yellowDark: '#B38F00',
            yellowLight: '#FFF8DB',
            bgDark: 'rgb(34, 34, 34)',
            cardDark: '#2B2B2B',
            cardBorder: '#3D3D3D',
            steelGrey: '#333333',
            steelLight: '#4D4D4D',
            muted: '#A3A3A3',
          },
        },
      },
    },
  };
</script>
<style>
  body {
    font-family: 'Poppins', sans-serif;
    background-color: rgb(34, 34, 34);
    color: #F5F5F5;
  }
  input[type=range] {
    accent-color: #FFCC00;
  }
  ::-webkit-scrollbar {
    width: 7px;
    height: 7px;
  }
  ::-webkit-scrollbar-track {
    background: #222222;
  }
  ::-webkit-scrollbar-thumb {
    background: #4D4D4D;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #FFCC00;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .no-spin::-webkit-outer-spin-button,
  .no-spin::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spin {
    -moz-appearance: textfield;
  }
  @media print {
    body {
      background-color: #FFFFFF !important;
      color: #171717 !important;
    }
    .no-print {
      display: none !important;
    }
    .print-only {
      display: block !important;
    }
    .bg-trough-cardDark {
      background-color: #F5F5F5 !important;
      border-color: #E5E5E5 !important;
      color: #171717 !important;
    }
  }
</style>
