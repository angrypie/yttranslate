import { crimson } from '@radix-ui/colors'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { styled } from '@stitches/react'
import { appConfig } from 'lib/config'
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
	container,
}: {
	children: React.ReactNode
	trigger: React.ReactNode
	container?: HTMLElement
}) => {
	const [open, setOpen] = React.useState(false)

	return (
		<PopoverRoot open={open}>
			<PopoverTrigger
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				asChild={true}
			>
				{trigger}
			</PopoverTrigger>
			<PopoverPrimitive.Portal container={container}>
				<StyledContent
					style={{ zIndex: appConfig.ui.zIndex }}
					side='top'
					sideOffset={8}
				>
					{children}
					<StyledArrow />
				</StyledContent>
			</PopoverPrimitive.Portal>
		</PopoverRoot>
	)
}
