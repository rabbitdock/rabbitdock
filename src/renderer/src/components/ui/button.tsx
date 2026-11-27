import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

// From shadcn/ui (base-nova style), adapted to the app's look with smaller corners, no offset on
// press, color transitions only and the app's focus ring. It keeps only the variant the app uses.
// Add the others, such as the main action, with the first screen that needs them, and give a filled
// button a focus ring that stays visible against its own color.
const buttonVariants = cva(
    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                ghost: 'hover:bg-accent',
            },
            size: {
                default: 'h-8 px-2.5',
            },
        },
        defaultVariants: {
            variant: 'ghost',
            size: 'default',
        },
    },
)

function Button({ className, variant, size, ...props }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
    return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
