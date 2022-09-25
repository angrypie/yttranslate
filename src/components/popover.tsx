import { crimson } from '@radix-ui/colors'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { styled } from '@stitches/react'
import React from 'react'

const StyledContent = styled(PopoverPrimitive.Content, {
	borderRadius: 4,
	padding: 10,
	backgroundColor: crimson.crimson10,
	outline: 'none',
})

const StyledArrow = styled(PopoverPrimitive.Arrow, {
	fill: crimson.crimson10,
})

export const PopoverRoot = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

export const Tooltip = ({
	trigger,
	children,
}: {
	children: React.ReactNode
	trigger: React.ReactNode
}) => {
	const [open, setOpen] = React.useState(false)

	return (
		<PopoverRoot open={open}>
			<PopoverTrigger
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				asChild
			>
				{trigger}
			</PopoverTrigger>
		<PopoverPrimitive.Portal>
			<StyledContent side='top' sideOffset={4}>
				{children}
				<StyledArrow />
			</StyledContent>
		</PopoverPrimitive.Portal>
		</PopoverRoot>
	)
}
