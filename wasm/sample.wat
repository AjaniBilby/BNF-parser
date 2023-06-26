(module
	(memory 1)
	(global $inputLength (mut i32) (i32.const 0))
	(global $heap (mut i32) (i32.const 0))

	(export "memory" (memory 0))
	(export "add" (func $add))
	(export "parse" (func $parse))
	(export "inputLength" (global $inputLength))

	(func $add (param $a i32) (param $b i32) (result i32)
		local.get $a
		local.get $b
		i32.add
	)
	(func $parse
		(param $index i32)

		global.get $inputLength
		global.set $heap

		(loop $continue
			local.get $index
			i32.load8_u
			i32.const 98
			i32.eq
			if
				global.get $heap
				local.get $index
				i32.store
				return
			end

			local.get $index
			i32.const 1
			i32.add
			local.set $index

			br $continue
		)
	)
)
