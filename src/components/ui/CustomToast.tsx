'use client'

import React from 'react'

const CustomToast = ({ message , styles}: {message: string, styles?: string}) => {
    console.log('dafa');
    if(styles?.toLowerCase().trim() === 'default') {
        styles = 'bg-gray-800 text-white';
    } else if(styles?.toLowerCase().trim() === 'success') {
        styles = 'bg-green-500 text-white';
    } else if(styles?.toLowerCase().trim() === 'error') {
        styles = 'bg-red-500 text-white';
    }

  return (
    <div id='ddddddd' className={`top-0 right-0 m-4 w-40 h-10 absolute ${styles}`}>{message}</div>
  )
}

export default CustomToast