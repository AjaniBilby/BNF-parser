(module
	(import "js" "print_i32" (func $print_i32 (param i32)))
	(import "js" "print_i32_i32_i32" (func $print_i32_i32_i32 (param i32) (param i32) (param i32)))

	(memory 1)

	(global $input i32 (i32.const 5))
	(global $inputLength (mut i32) (i32.const 0))
	(global $heap (mut i32) (i32.const 0))

	(export "memory" (memory 0))
	(export "add" (func $add))
	(export "input" (global $input))
	(export "inputLength" (global $inputLength))
	(export "program" (func $program))
	(export "_init" (func $_init))

	(data (i32.const 0) "Hello")

	(func $add (param $a i32) (param $b i32) (result i32)
		local.get $a
		local.get $b
		i32.add
	)
	(func $_init
		(param $index i32)

		global.get $inputLength
		global.get $input
		i32.add
		i32.const 3
		i32.add
		i32.const -4
		i32.and
		global.set $heap
	)
	(func $program
		(param $index i32)

		;; local.get $index
		;; i32.const 0
		;; call $findChar

		global.get $heap
		local.get $index
		i32.const 0
		i32.const 5
		call $matchString
		i32.store
	)
	(func $matchString
		(param $index i32)
		(param $str i32)
		(param $strLen i32)
		(result i32)
		(local $offset i32)

		i32.const 0
		local.set $offset

		(loop $continue
			local.get $index
			local.get $offset
			i32.add
			i32.load8_u
			local.get $str
			local.get $offset
			i32.add
			i32.load8_u
			i32.ne
			if
				local.get $offset
				return
			end

			;; increase offset
			local.get $offset
			i32.const 1
			i32.add
			local.set $offset

			;; check if met end of target
			local.get $offset
			local.get $str
			i32.add
			local.get $strLen
			i32.ge_s
			if
				local.get $offset
				return
			end

			;; check if met end of input
			local.get $offset
			local.get $index
			i32.add
			global.get $heap
			i32.ge_s
			if
				local.get $offset
				return
			end

			br $continue
		)

		local.get $offset
		return
	)
	(func $findChar
		(param $index i32)

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
