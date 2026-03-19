package com.xxxx.ddd.controller.model.vo;

import lombok.Data;

import java.io.Serializable;


@Data
public class ResultMessage<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private boolean success;// success flag
    private String message;
    private Integer code;// return code
    private long timestamp = System.currentTimeMillis();

    private T result; // result object
}
