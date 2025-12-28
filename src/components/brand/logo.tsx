import { cn } from "@/lib/utils"

interface LogoProps {
    className?: string
    showText?: boolean
    height?: number
}

export function CheckSuiteLogo({ className, showText = true, height = 40 }: LogoProps) {
    // SVG Aspect Ratio is 300:100 = 3:1.
    // If height is 40, width should be 120.
    // We utilize viewBox to scale correctly.

    return (
        <div className={cn("flex items-center", className)} style={{ height }}>
            <svg
                viewBox="0 0 300 100"
                xmlns="http://www.w3.org/2000/svg"
                style={{ height: '100%', width: 'auto' }} // auto width preserves aspect ratio based on height
                aria-label="CheckSuite Logo"
            >
                <style>
                    {`.text { font-family: sans-serif; font-size: 28px; font-weight: bold; dominant-baseline: middle; }`}
                </style>
                {/* Icon Part */}
                <rect x="10" y="20" width="50" height="60" rx="6" ry="6" fill="none" stroke="#000000" strokeWidth="4" />
                <line x1="20" y1="35" x2="40" y2="35" stroke="#000000" strokeWidth="3" />
                <line x1="20" y1="50" x2="45" y2="50" stroke="#000000" strokeWidth="3" />
                <line x1="20" y1="65" x2="42" y2="65" stroke="#000000" strokeWidth="3" />
                <polyline points="18,47 26,55 44,30" fill="none" stroke="#9146FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Text Part */}
                {showText && (
                    <>
                        <text x="70" y="50" className="text" fill="#000000">Check</text>
                        <text x="145" y="50" className="text" fill="#9146FF">Suite</text>
                    </>
                )}
            </svg>
        </div>
    )
}
